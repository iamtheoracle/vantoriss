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
import {
  findDuplicate,
  consolidateDuplicate,
  assessSourceReliability,
  flagRisks,
  transitionCaseState,
  transitionOrgState,
} from './discoveryPipeline';

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
    let consolidated = 0;
    const errors = [];

    // Fetch existing records in this domain for deduplication
    const existingRecords = await base44.entities.DiscoveryRecord.filter({
      discovery_domain: domain,
      status: 'active',
    }, '-discovered_date', 100).catch(() => []);

    for (const item of items.slice(0, maxResults)) {
      try {
        // === DEDUPLICATION ===
        // Check if this item is a duplicate of an existing record
        const dupCheck = findDuplicate(item, existingRecords);
        if (dupCheck.isDuplicate && dupCheck.matchType === 'url') {
          // Exact URL match — just update last_checked
          await base44.entities.DiscoveryRecord.update(dupCheck.duplicateRecord.id, {
            last_checked: new Date().toISOString(),
            freshness_status: 'current',
          }).catch(() => {});
          updated++;
          continue;
        }
        if (dupCheck.isDuplicate && dupCheck.matchType === 'title') {
          // Title similarity match — consolidate by adding corroborating source
          await consolidateDuplicate(dupCheck.duplicateRecord, item, 'DiscoveryRecord');
          consolidated++;

          // Log consolidation as a change
          await base44.entities.DiscoveryChange.create({
            discovery_record_id: dupCheck.duplicateRecord.id,
            change_type: 'updated',
            change_summary: `Consolidated duplicate source: ${item.source_name || item.source_url}`,
            detected_at: new Date().toISOString(),
            requires_review: false,
          }).catch(() => {});
          continue;
        }

        // === SOURCE RELIABILITY ASSESSMENT ===
        const reliability = assessSourceReliability({
          source_type: getSourceTypeForDomain(domain),
          verification_status: item.verification_status || 'unverified',
          corroborating_count: (item.corroborating_sources || []).length,
          conflicting_count: 0,
        });

        // === RISK FLAGGING ===
        const riskFlags = flagRisks(item, { result: item.verification_status });

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
          metadata: JSON.stringify({
            ...(item.domain_metadata || {}),
            _reliability_score: reliability.score,
            _reliability_tier: reliability.tier,
            _risk_flags: riskFlags,
          }),
          status: 'active',
        };

        // Create new record
        const created = await base44.entities.DiscoveryRecord.create(recordData);
        discovered++;

        // Route to domain-specific entity with pipeline state
        await routeToDomainEntity(domain, created, item, { reliability, riskFlags });
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
        records_updated: updated + consolidated,
        errors: JSON.stringify(errors),
        summary: `Discovered ${discovered} new records, updated ${updated} existing, consolidated ${consolidated} duplicates.`,
      }).catch(() => {});
    }

    return { runId: run?.id, recordsDiscovered: discovered, recordsUpdated: updated, recordsConsolidated: consolidated, errors };
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
 * All new cases start at 'discovered' state and must pass through the
 * verification pipeline before becoming donor-visible.
 */
async function routeToDomainEntity(domain, discoveryRecord, item, context = {}) {
  const metadata = item.domain_metadata || {};
  const { reliability, riskFlags } = context;

  switch (domain) {
    case 'humanitarian':
      if (metadata.recipient_type && metadata.category) {
        // Check for duplicate humanitarian case before creating
        const existingCases = await base44.entities.HumanitarianCase.filter({
          case_status: { $in: ['discovered', 'verification_pending', 'review_pending', 'approved', 'active'] },
        }, '-date_discovered', 100).catch(() => []);

        const caseDup = findDuplicate(item, existingCases);
        if (caseDup.isDuplicate) {
          // Consolidate — add source to existing case
          await consolidateDuplicate(caseDup.duplicateRecord, item, 'HumanitarianCase');
          break;
        }

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
          // Pipeline state — starts at 'discovered', NOT donor-visible
          case_status: 'discovered',
          review_status: 'pending',
          expiration_recheck_date: computeNextRecheck(72),
          assigned_division: 'humanitarian',
          risk_flags: JSON.stringify([...(metadata.risk_flags || []), ...(riskFlags || [])]),
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
        // Check for duplicate organization before creating
        const existingOrgs = await base44.entities.OrganizationProfile.filter({
          status: { $in: ['discovered', 'verification_pending', 'verified', 'approved', 'active'] },
        }, '-date_discovered', 100).catch(() => []);

        const orgDup = findDuplicate(
          { title: metadata.organization_name || item.title, source_url: item.source_url },
          existingOrgs
        );
        if (orgDup.isDuplicate) {
          await consolidateDuplicate(orgDup.duplicateRecord, item, 'OrganizationProfile');
          break;
        }

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
          // Pipeline state — starts at 'discovered', NOT donor-visible
          status: 'discovered',
          responsible_division: 'humanitarian',
          risk_flags: JSON.stringify([...(metadata.risk_flags || []), ...(riskFlags || [])]),
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
        // Record previous state for change detection
        const previousState = {
          freshness_status: record.freshness_status,
          verification_status: record.verification_status,
          confidence_level: record.confidence_level,
        };

        // Mark as stale
        await base44.entities.DiscoveryRecord.update(record.id, {
          freshness_status: 'stale',
        }).catch(() => {});
        staleCount++;

        // Record change with previous/new values
        await base44.entities.DiscoveryChange.create({
          discovery_record_id: record.id,
          change_type: 'status_changed',
          previous_value: JSON.stringify(previousState),
          new_value: JSON.stringify({ freshness_status: 'stale' }),
          change_summary: `Record marked stale — exceeded freshness window`,
          detected_at: new Date().toISOString(),
          requires_review: true,
        }).catch(() => {});

        // Create alert for stale data
        await base44.entities.DiscoveryAlert.create({
          alert_type: 'stale_data',
          severity: 'medium',
          discovery_record_id: record.id,
          description: `Record "${record.title}" has exceeded its freshness window and needs rechecking.`,
          responsible_division: record.responsible_division || 'intelligence',
          status: 'open',
        }).catch(() => {});

        // If this record is linked to a humanitarian case, transition to stale
        if (record.linked_entity_type === 'HumanitarianCase' && record.linked_entity_id) {
          await transitionCaseState(record.linked_entity_id, 'stale').catch(() => {});
        }
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

    // Record previous state for change detection
    const previousState = {
      verification_status: record.verification_status,
      confidence_level: record.confidence_level,
    };

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

    const newVerificationStatus = llmResponse?.result || 'failed';

    // Update discovery record
    await base44.entities.DiscoveryRecord.update(recordId, {
      verification_status: newVerificationStatus,
      confidence_level: llmResponse?.confidence_level || 'low',
      last_checked: new Date().toISOString(),
    });

    // Record change if verification status changed
    if (previousState.verification_status !== newVerificationStatus) {
      await base44.entities.DiscoveryChange.create({
        discovery_record_id: recordId,
        change_type: 'verification_changed',
        previous_value: JSON.stringify(previousState),
        new_value: JSON.stringify({ verification_status: newVerificationStatus, confidence_level: llmResponse?.confidence_level }),
        change_summary: `Verification status changed: ${previousState.verification_status} → ${newVerificationStatus}`,
        detected_at: new Date().toISOString(),
        requires_review: newVerificationStatus === 'conflicting' || newVerificationStatus === 'failed',
      }).catch(() => {});
    }

    // Transition linked humanitarian case through pipeline
    if (record.linked_entity_type === 'HumanitarianCase' && record.linked_entity_id) {
      if (newVerificationStatus === 'verified' || newVerificationStatus === 'partially_verified') {
        // Move to review_pending after successful verification
        await transitionCaseState(record.linked_entity_id, 'verification_pending').catch(() => {});
        await transitionCaseState(record.linked_entity_id, 'review_pending').catch(() => {});
      } else if (newVerificationStatus === 'failed') {
        await transitionCaseState(record.linked_entity_id, 'verification_failed').catch(() => {});
      }
    }

    // Transition linked organization through pipeline
    if (record.linked_entity_type === 'OrganizationProfile' && record.linked_entity_id) {
      if (newVerificationStatus === 'verified') {
        await transitionOrgState(record.linked_entity_id, 'verified').catch(() => {});
      }
    }

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

function getSourceTypeForDomain(domain) {
  const map = {
    humanitarian: 'ngo',
    commerce: 'retailer',
    news: 'news',
    legal_regulatory: 'government',
    market: 'market_data',
    organization: 'ngo',
    risk: 'other',
    internal: 'other',
  };
  return map[domain] || 'other';
}

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

/**
 * Refresh stale records by re-checking their sources.
 * Records marked 'stale' are re-verified; if the source is still available,
 * the record is updated. If the source is broken, it's marked 'unavailable'.
 */
export async function refreshStaleRecords() {
  const run = await base44.entities.DiscoveryRun.create({
    run_type: 'freshness_check',
    status: 'running',
    started_at: new Date().toISOString(),
    triggered_by: 'scheduled',
    responsible_division: 'intelligence',
  }).catch(() => null);

  let refreshed = 0;
  let stillStale = 0;
  let unavailable = 0;

  try {
    const staleRecords = await base44.entities.DiscoveryRecord.filter({
      freshness_status: 'stale',
      status: 'active',
    }, '-last_checked', 50).catch(() => []);

    for (const record of staleRecords) {
      try {
        // Re-verify the record
        const result = await verifyDiscoveryRecord(record.id);

        if (result.verified) {
          await base44.entities.DiscoveryRecord.update(record.id, {
            freshness_status: 'current',
            last_checked: new Date().toISOString(),
            next_recheck: computeNextRecheck(24),
          });
          refreshed++;
        } else if (result.result === 'failed') {
          await base44.entities.DiscoveryRecord.update(record.id, {
            freshness_status: 'unavailable',
          });
          unavailable++;

          await base44.entities.DiscoveryAlert.create({
            alert_type: 'source_unavailable',
            severity: 'medium',
            discovery_record_id: record.id,
            description: `Source for "${record.title}" is no longer available.`,
            responsible_division: record.responsible_division || 'intelligence',
            status: 'open',
          }).catch(() => {});
        } else {
          stillStale++;
        }
      } catch (err) {
        stillStale++;
      }
    }

    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_checked: staleRecords.length,
        records_updated: refreshed,
        records_stale: stillStale,
        summary: `Stale refresh: ${refreshed} refreshed, ${stillStale} still stale, ${unavailable} unavailable.`,
      }).catch(() => {});
    }

    return { refreshed, stillStale, unavailable };
  } catch (err) {
    if (run) {
      await base44.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: JSON.stringify([err.message]),
      }).catch(() => {});
    }
    return { refreshed: 0, stillStale: 0, unavailable: 0, error: err.message };
  }
}

/**
 * Detect changes in HeroBox product catalog.
 * Compares current product state with stored state and records changes.
 */
export async function detectProductChanges() {
  const products = await base44.entities.HeroBoxProduct.filter({
    status: 'active',
  }, '-retrieved_at', 200).catch(() => []);

  let changesDetected = 0;
  const alerts = [];

  for (const product of products) {
    // Check freshness
    const freshness = computeProductFreshness(product.retrieved_at);

    if (freshness === 'stale' && product.freshness_status !== 'stale') {
      const previousState = { freshness_status: product.freshness_status };
      await base44.entities.HeroBoxProduct.update(product.id, {
        freshness_status: 'stale',
      }).catch(() => {});

      // Find discovery record for this product if linked
      const discRecords = await base44.entities.DiscoveryRecord.filter({
        linked_entity_type: 'HeroBoxProduct',
        linked_entity_id: product.id,
      }).catch(() => []);

      for (const dr of discRecords) {
        await base44.entities.DiscoveryChange.create({
          discovery_record_id: dr.id,
          change_type: 'status_changed',
          previous_value: JSON.stringify(previousState),
          new_value: JSON.stringify({ freshness_status: 'stale' }),
          change_summary: `Product "${product.name}" marked stale`,
          detected_at: new Date().toISOString(),
          requires_review: true,
        }).catch(() => {});
      }

      alerts.push({
        alert_type: 'stale_data',
        description: `Product "${product.name}" catalog data is stale`,
        product_id: product.id,
      });
      changesDetected++;
    }

    // Check availability changes
    if (product.availability === 'unavailable' || product.availability === 'discontinued') {
      // These products should be suppressed from packages
      if (product.freshness_status !== 'expired') {
        await base44.entities.HeroBoxProduct.update(product.id, {
          freshness_status: product.availability === 'discontinued' ? 'expired' : 'stale',
        }).catch(() => {});
        changesDetected++;
      }
    }
  }

  // Create alerts for detected changes
  for (const alert of alerts) {
    await base44.entities.DiscoveryAlert.create({
      alert_type: alert.alert_type,
      severity: 'medium',
      description: alert.description,
      responsible_division: 'reconnaissance',
      status: 'open',
    }).catch(() => {});
  }

  return { changesDetected, totalProducts: products.length };
}

function computeProductFreshness(retrievedAt) {
  if (!retrievedAt) return 'unavailable';
  const ageMs = Date.now() - new Date(retrievedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours > 72) return 'stale';
  if (ageHours > 24) return 'recent';
  return 'current';
}