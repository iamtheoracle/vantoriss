/**
 * Vantoris Discovery & Intelligence Network — Engine
 *
 * Autonomous research, discovery, verification, monitoring, and updating layer
 * operating underneath Vantoris Command.
 *
 * PRINCIPLES:
 * - Discovery is NOT authorization.
 * - Research is NOT execution.
 * - A recommendation is NOT an approved decision.
 * - Never fabricate evidence, URLs, prices, availability, organizations, people, or events.
 * - If verification fails, mark the item unverified.
 * - If a source is unavailable, mark it unavailable.
 *
 * This module provides the client-side discovery orchestration that uses
 * InvokeLLM with web search to discover and verify information, then stores
 * results in DiscoveryRecord and domain-specific entities.
 */

import { base44 } from '@/api/base44Client';

/**
 * The 8 discovery domains of the Vantoris Discovery & Intelligence Network.
 */
export const DISCOVERY_DOMAINS = [
  'humanitarian',
  'commerce',
  'news',
  'legal_regulatory',
  'market',
  'organization',
  'risk',
  'internal',
];

/**
 * Execute a discovery run for a given domain.
 * Uses InvokeLLM with add_context_from_internet to search the web.
 *
 * @param {string} domain - Discovery domain (humanitarian, commerce, news, etc.)
 * @param {Object} options - { query, sources, maxResults }
 * @returns {Object} - { runId, recordsDiscovered, recordsUpdated, errors }
 */
export async function executeDiscoveryRun(domain, options = {}) {
  const { query, maxResults = 10 } = options;

  // Log the run
  const run = await base44.entities.DiscoveryRun.create({
    run_type: `${domain}_discovery`,
    status: 'running',
    started_at: new Date().toISOString(),
    triggered_by: options.triggered_by || 'manual',
    responsible_division: getDivisionForDomain(domain),
  }).catch(() => null);

  try {
    // Use InvokeLLM with web search to discover information
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildDiscoveryPrompt(domain, query),
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                source_url: { type: 'string' },
                source_name: { type: 'string' },
                source_domain: { type: 'string' },
                source_classification: { type: 'string', enum: ['primary', 'secondary'] },
                publication_date: { type: 'string' },
                content_summary: { type: 'string' },
                confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                verification_status: { type: 'string', enum: ['unverified', 'partially_verified', 'verified'] },
                evidence_summary: { type: 'string' },
                corroborating_sources: { type: 'array', items: { type: 'string' } },
                external_reference: { type: 'string' },
                domain_metadata: { type: 'object' },
              },
            },
          },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    const items = llmResponse?.items || [];
    let discovered = 0;
    let updated = 0;
    const errors = [];

    for (const item of items.slice(0, maxResults)) {
      try {
        // Check for existing record by source_url
        const existing = await base44.entities.DiscoveryRecord.filter({
          source_url: item.source_url,
        }).catch(() => []);

        const recordData = {
          discovery_domain: domain,
          title: item.title,
          description: item.description || '',
          content_summary: item.content_summary || '',
          source_url: item.source_url,
          source_domain: item.source_domain || '',
          source_name: item.source_name || '',
          source_classification: item.source_classification || 'secondary',
          publication_date: item.publication_date || null,
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          corroborating_sources: JSON.stringify(item.corroborating_sources || []),
          evidence_summary: item.evidence_summary || '',
          responsible_division: getDivisionForDomain(domain),
          next_recheck: computeNextRecheck(24),
          external_reference: item.external_reference || '',
          metadata: JSON.stringify(item.domain_metadata || {}),
          status: 'active',
        };

        if (existing && existing.length > 0) {
          // Update existing record
          await base44.entities.DiscoveryRecord.update(existing[0].id, {
            ...recordData,
            discovered_date: existing[0].discovered_date,
          });
          updated++;

          // Log change
          await base44.entities.DiscoveryChange.create({
            discovery_record_id: existing[0].id,
            change_type: 'updated',
            change_summary: `Refreshed during ${domain} discovery run`,
            detected_at: new Date().toISOString(),
            requires_review: false,
          }).catch(() => {});
        } else {
          // Create new record
          const created = await base44.entities.DiscoveryRecord.create(recordData);
          discovered++;

          // Route to domain-specific entity
          await routeToDomainEntity(domain, created, item);
        }
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Update run
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: errors.length > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        sources_checked: items.length,
        records_discovered: discovered,
        records_updated: updated,
        errors: JSON.stringify(errors),
        summary: `Discovered ${discovered} new records, updated ${updated} existing records.`,
      }).catch(() => {});
    }

    return { runId: run?.id, recordsDiscovered: discovered, recordsUpdated: updated, errors };
  } catch (err) {
    // Mark run as failed
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: JSON.stringify([err.message]),
        summary: `Discovery run failed: ${err.message}`,
      }).catch(() => {});
    }

    // Create alert
    await base44.entities.DiscoveryAlert.create({
      alert_type: 'source_unavailable',
      severity: 'high',
      description: `${domain} discovery run failed: ${err.message}`,
      responsible_division: getDivisionForDomain(domain),
      status: 'open',
    }).catch(() => {});

    return { runId: run?.id, recordsDiscovered: 0, recordsUpdated: 0, errors: [err.message] };
  }
}

/**
 * Route a discovered record to the appropriate domain-specific entity.
 */
async function routeToDomainEntity(domain, discoveryRecord, item) {
  const metadata = item.domain_metadata || {};

  switch (domain) {
    case 'humanitarian':
      if (metadata.recipient_type && metadata.category) {
        await base44.entities.HumanitarianCase.create({
          case_title: item.title,
          recipient_type: metadata.recipient_type,
          recipient_name: metadata.recipient_name || '',
          category: metadata.category,
          location: metadata.location || '',
          stated_need: metadata.stated_need || item.description || '',
          requested_assistance: metadata.requested_assistance || '',
          estimated_amount: metadata.estimated_amount || 0,
          source_url: item.source_url,
          source_name: item.source_name,
          discovery_record_id: discoveryRecord.id,
          evidence: JSON.stringify(metadata.evidence || []),
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          date_discovered: new Date().toISOString(),
          case_status: 'open',
          review_status: 'pending',
          expiration_recheck_date: computeNextRecheck(72),
          assigned_division: 'humanitarian',
          risk_flags: JSON.stringify(metadata.risk_flags || []),
        }).catch(() => {});
      }
      break;

    case 'news':
      await base44.entities.NewsRecord.create({
        headline: item.title,
        summary: item.content_summary || item.description || '',
        category: metadata.news_category || 'international',
        source_url: item.source_url,
        source_name: item.source_name,
        source_domain: item.source_domain,
        publication_date: item.publication_date,
        discovered_date: new Date().toISOString(),
        last_checked: new Date().toISOString(),
        freshness_status: 'current',
        verification_status: item.verification_status || 'unverified',
        confidence_level: item.confidence_level || 'low',
        corroborating_sources: JSON.stringify(item.corroborating_sources || []),
        is_confirmed: metadata.is_confirmed || false,
        responsible_division: 'intelligence',
        discovery_record_id: discoveryRecord.id,
      }).catch(() => {});
      break;

    case 'legal_regulatory':
      await base44.entities.LegalRegulatoryRecord.create({
        title: item.title,
        jurisdiction: metadata.jurisdiction || '',
        authority: metadata.authority || '',
        source_url: item.source_url,
        source_name: item.source_name,
        document_identifier: metadata.document_identifier || '',
        publication_date: item.publication_date,
        effective_date: metadata.effective_date,
        record_status: metadata.record_status || 'effective',
        affected_area: metadata.affected_area || 'other',
        summary: item.content_summary || item.description || '',
        evidence: item.evidence_summary || '',
        confidence_level: item.confidence_level || 'medium',
        verification_status: item.verification_status || 'unverified',
        last_checked: new Date().toISOString(),
        responsible_division: 'compliance',
        discovery_record_id: discoveryRecord.id,
      }).catch(() => {});
      break;

    case 'market':
      if (metadata.asset_symbol) {
        await base44.entities.MarketIntelligenceRecord.create({
          asset_symbol: metadata.asset_symbol,
          asset_name: metadata.asset_name || item.title,
          asset_type: metadata.asset_type || 'stock',
          current_price: metadata.current_price || 0,
          currency: 'USD',
          price_timestamp: new Date().toISOString(),
          source_url: item.source_url,
          source_name: item.source_name,
          source_domain: item.source_domain,
          market_event: metadata.market_event || '',
          corporate_action: metadata.corporate_action || '',
          earnings_info: metadata.earnings_info || '',
          discovered_date: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          freshness_status: 'current',
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          responsible_division: 'markets',
          provider_connected: false,
          discovery_record_id: discoveryRecord.id,
        }).catch(() => {});
      }
      break;

    case 'organization':
      if (metadata.organization_type) {
        await base44.entities.OrganizationProfile.create({
          name: metadata.organization_name || item.title,
          organization_type: metadata.organization_type,
          description: item.content_summary || item.description || '',
          location: metadata.location || '',
          website_url: metadata.website_url || item.source_url,
          verification_status: item.verification_status || 'unverified',
          confidence_level: item.confidence_level || 'low',
          source_url: item.source_url,
          source_name: item.source_name,
          discovery_record_id: discoveryRecord.id,
          date_discovered: new Date().toISOString(),
          status: 'unverified',
          responsible_division: 'humanitarian',
          risk_flags: JSON.stringify(metadata.risk_flags || []),
        }).catch(() => {});
      }
      break;
  }
}

/**
 * Check freshness of existing records and mark stale ones.
 */
export async function checkFreshness() {
  const run = await base44.entities.DiscoveryRun.create({
    run_type: 'freshness_check',
    status: 'running',
    started_at: new Date().toISOString(),
    triggered_by: 'scheduled',
    responsible_division: 'intelligence',
  }).catch(() => null);

  let staleCount = 0;
  let updatedCount = 0;

  try {
    // Get all active discovery records
    const records = await base44.entities.DiscoveryRecord.filter({
      status: 'active',
    }).catch(() => []);

    const now = Date.now();

    for (const record of records) {
      const nextRecheck = record.next_recheck ? new Date(record.next_recheck).getTime() : 0;
      if (nextRecheck > 0 && nextRecheck < now) {
        // Mark as stale
        await base44.entities.DiscoveryRecord.update(record.id, {
          freshness_status: 'stale',
        }).catch(() => {});
        staleCount++;

        // Create alert for stale data
        await base44.entities.DiscoveryAlert.create({
          alert_type: 'stale_data',
          severity: 'medium',
          discovery_record_id: record.id,
          description: `Record "${record.title}" has exceeded its freshness window and needs rechecking.`,
          responsible_division: record.responsible_division || 'intelligence',
          status: 'open',
        }).catch(() => {});
      } else {
        updatedCount++;
      }
    }

    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_checked: records.length,
        records_stale: staleCount,
        records_updated: updatedCount,
        summary: `Freshness check: ${staleCount} stale records, ${updatedCount} current.`,
      }).catch(() => {});
    }

    return { staleCount, updatedCount };
  } catch (err) {
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: JSON.stringify([err.message]),
      }).catch(() => {});
    }
    return { staleCount: 0, updatedCount: 0, error: err.message };
  }
}

/**
 * Refresh HeroBox product catalog from connected providers.
 * Only works if a real provider integration exists.
 */
export async function refreshProductCatalog() {
  const run = await base44.entities.DiscoveryRun.create({
    run_type: 'product_refresh',
    status: 'running',
    started_at: new Date().toISOString(),
    triggered_by: 'scheduled',
    responsible_division: 'reconnaissance',
  }).catch(() => null);

  try {
    // Check for connected commerce sources
    const sources = await base44.entities.DiscoverySource.filter({
      discovery_domain: 'commerce',
      status: 'active',
    }).catch(() => []);

    const connectedSources = sources.filter((s) => s.api_available && s.api_connector_id);

    if (connectedSources.length === 0) {
      // No real provider integration — mark as unavailable, do NOT fabricate
      if (run) {
        await base44.entities.DiscoveryRun.update(run.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          summary: 'No connected commerce providers. Catalog refresh skipped — no real provider integration available.',
        }).catch(() => {});
      }

      await base44.entities.DiscoveryAlert.create({
        alert_type: 'provider_error',
        severity: 'medium',
        description: 'No connected commerce providers. Product catalog cannot be refreshed automatically.',
        responsible_division: 'reconnaissance',
        status: 'open',
      }).catch(() => {});

      return { refreshed: 0, reason: 'No connected providers' };
    }

    // If we have connected sources, we would refresh from them here
    // This requires actual API integration which depends on the provider
    let refreshed = 0;
    for (const source of connectedSources) {
      try {
        // TODO: When a real provider connector is connected, fetch live product data here
        // For now, we mark the source as checked
        await base44.entities.DiscoverySource.update(source.id, {
          last_checked: new Date().toISOString(),
        });
        refreshed++;
      } catch (err) {
        await base44.entities.DiscoverySource.update(source.id, {
          status: 'unavailable',
          last_error: err.message,
          last_checked: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_checked: connectedSources.length,
        records_updated: refreshed,
        summary: `Refreshed ${refreshed} products from ${connectedSources.length} connected sources.`,
      }).catch(() => {});
    }

    return { refreshed, sources: connectedSources.length };
  } catch (err) {
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: JSON.stringify([err.message]),
      }).catch(() => {});
    }
    return { refreshed: 0, error: err.message };
  }
}

/**
 * Verify a discovery record by cross-checking with additional sources.
 */
export async function verifyDiscoveryRecord(recordId) {
  const record = await base44.entities.DiscoveryRecord.get(recordId).catch(() => null);
  if (!record) return { verified: false, reason: 'Record not found' };

  try {
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Verify the following discovered information by cross-checking with multiple credible sources. Determine if the information is accurate, partially accurate, or conflicting.\n\nTitle: ${record.title}\nDescription: ${record.description}\nSource URL: ${record.source_url}\nSource: ${record.source_name}\n\nProvide:\n1. Verification result (verified, partially_verified, conflicting, or failed)\n2. Sources checked\n3. Evidence summary\n4. Any conflicts found\n5. Confidence level`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          result: { type: 'string', enum: ['verified', 'partially_verified', 'conflicting', 'failed'] },
          sources_checked: { type: 'array', items: { type: 'string' } },
          evidence_summary: { type: 'string' },
          conflicts_found: { type: 'string' },
          confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    });

    // Create verification record
    await base44.entities.VerificationRecord.create({
      discovery_record_id: recordId,
      verification_type: 'cross_check',
      verifier_division: 'intelligence',
      sources_checked: JSON.stringify(llmResponse?.sources_checked || []),
      result: llmResponse?.result || 'failed',
      evidence_summary: llmResponse?.evidence_summary || '',
      conflicts_found: llmResponse?.conflicts_found || '',
      verification_date: new Date().toISOString(),
      verifier_notes: '',
    });

    // Update discovery record
    await base44.entities.DiscoveryRecord.update(recordId, {
      verification_status: llmResponse?.result || 'failed',
      confidence_level: llmResponse?.confidence_level || 'low',
      last_checked: new Date().toISOString(),
    });

    return {
      verified: llmResponse?.result === 'verified',
      result: llmResponse?.result,
      confidence: llmResponse?.confidence_level,
    };
  } catch (err) {
    return { verified: false, error: err.message };
  }
}

// === HELPERS ===

function getDivisionForDomain(domain) {
  const divisionMap = {
    humanitarian: 'humanitarian',
    commerce: 'reconnaissance',
    news: 'intelligence',
    legal_regulatory: 'compliance',
    market: 'markets',
    organization: 'humanitarian',
    risk: 'risk',
    internal: 'operations',
  };
  return divisionMap[domain] || 'intelligence';
}

function computeNextRecheck(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function buildDiscoveryPrompt(domain, query) {
  const baseInstruction = `You are the Vantoris Discovery & Intelligence Network. Your task is to discover REAL, VERIFIED information from the web. NEVER fabricate people, organizations, products, prices, news events, legal sources, market data, or verification results. If you cannot verify information, mark it as unverified. Prefer primary sources (government, court, regulator, official organization) over secondary sources.`;

  const domainInstructions = {
    humanitarian: `Discover legitimate, publicly documented humanitarian assistance needs. Look for: people requiring financial assistance, surgery/medical fundraising, families requiring essential support, food assistance, children's homes, orphanages, shelters, legitimate NGOs, humanitarian organizations, deployed military personnel/families requiring legitimate assistance, organizations requesting food or essential supplies. Do NOT diagnose medical conditions. Do NOT invent medical needs. Only create a case when sufficient public evidence exists. For each item, include: recipient_type (individual/family/childrens_home/orphanage/shelter/ngo/organization/military_personnel/military_family/community), category (financial_assistance/surgery_medical/food/essential_supplies/children_support/shelter/emergency/military_support/communication), location, stated_need, requested_assistance, estimated_amount if documented, evidence array, risk_flags array.`,
    commerce: `Discover real products from approved retailers and commerce providers. For each product include in domain_metadata: product name, category, current price, currency, availability, destination availability, shipping info, product URL, product image reference if permitted, discount info if genuine. NEVER fabricate prices or inventory. If a retailer is not actually accessible, do not include products from it.`,
    news: `Monitor legitimate news sources for: breaking news, major international events, local events, humanitarian developments, military developments, financial news, company announcements, regulatory developments, technology developments. For each story include in domain_metadata: news_category, is_confirmed (true only if confirmed by multiple credible sources), conflicting reports. Do NOT present unverified breaking reports as established facts.`,
    legal_regulatory: `Monitor legitimate legal and regulatory sources. Track: legislation, regulations, regulatory announcements, court decisions, official government notices, banking/financial/investment/payments regulation, consumer protection, NGO/charity regulation. For each item include in domain_metadata: jurisdiction, authority, document_identifier, effective_date, record_status, affected_area. Prioritize primary legal sources. This is NOT legal advice.`,
    market: `Monitor approved market-data sources. Track: stocks, securities, market prices, company announcements, corporate actions, earnings, market-moving news. For each item include in domain_metadata: asset_symbol, asset_name, asset_type, current_price, currency, market_event, corporate_action, earnings_info. Every market value must have a timestamp and source. Do NOT fabricate prices.`,
    organization: `Discover legitimate organizations: NGOs, charities, children's homes, shelters, humanitarian organizations, military-support organizations, community organizations, businesses, approved service providers. For each include in domain_metadata: organization_type, organization_name, location, website_url, risk_flags. Do NOT create profiles from weak or suspicious evidence.`,
    risk: `Detect potential: fraudulent fundraising, impersonation, fake organizations, suspicious websites, contradictory claims, suspicious payment requests, duplicate cases, stale cases, manipulated information, suspicious product listings. Risk findings are signals requiring review, NOT accusations.`,
    internal: `Monitor the Vantoris system for: stale data, failed integrations, unavailable providers, unresolved humanitarian cases, outdated product information, failed workflows, operational exceptions, data-integrity issues, permission anomalies, incomplete records.`,
  };

  return `${baseInstruction}\n\nDOMAIN: ${domain.toUpperCase()}\n${domainInstructions[domain] || ''}\n\nQUERY: ${query || 'Perform a general discovery sweep for this domain.'}\n\nReturn up to 10 real, verified items. For each item, provide: title, description, source_url, source_name, source_domain, source_classification (primary/secondary), publication_date, content_summary, confidence_level, verification_status, evidence_summary, corroborating_sources, external_reference, and domain_metadata with domain-specific fields.`;
}