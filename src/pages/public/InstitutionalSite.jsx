import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { institutionalMedia } from './institutionalMedia';
import './institutional-site.css';

const navigation = [
  ['Home', '/'],
  ['About Vantoris', '/about'],
  ['Our History', '/history'],
  ['Leadership', '/leadership'],
  ['Institutions', '/institutions'],
  ['Private Banking', '/private-banking'],
  ['T Market', '/t-market'],
  ['Research & Intelligence', '/research'],
  ['Heritage', '/heritage'],
  ['Stories & Publications', '/stories'],
  ['Spirituality & Philosophy', '/spirituality'],
  ['Careers', '/careers'],
  ['News', '/news'],
  ['Contact', '/contact'],
];

const pages = {
  about: {
    eyebrow: 'The group',
    title: 'A coordinated group. Independent institutions.',
    lede: 'Vantoris Private Institution Group is being developed around a clear institutional principle: coordination at group level, with distinct identity, governance, authority and responsibility retained by each institution.',
    sections: [
      { title: 'A long view', body: 'The group’s ambition is to build durable institutions with a disciplined approach to governance, research, stewardship and service. Its public identity should communicate purpose and direction without overstating what has been established or launched.' },
      { title: 'Clear institutional boundaries', body: 'Group Headquarters coordinates approved strategy, reporting and shared services. It does not automatically assume the banking authority, client records or financial decision rights of an independent institution.' },
      { title: 'A connected institutional world', body: 'The wider Vantoris world brings together institutional development, private banking, market research, heritage, publications and cultural inquiry. Each activity retains its own purpose and appropriate controls.' },
    ],
    aside: 'The group’s public history, legal identity, leadership and operating milestones will be published only from approved and verifiable records.',
  },
  history: {
    eyebrow: 'History & continuity',
    title: 'An institutional history, recorded with care.',
    lede: 'A credible history is built from primary records, dated evidence and the context around people, institutions and decisions—not from invented milestones.',
    sections: [
      { title: 'The historical record', body: 'The Vantoris history collection is intended to preserve founding context, institutional decisions, important people, places, documents, achievements, setbacks and lessons as supporting material is verified.' },
      { title: 'A living timeline', body: 'Each milestone will retain its date or period, source, related institution, verification state and editorial history. Unknown dates will remain unknown rather than being estimated.' },
      { title: 'What is published now', body: 'No complete, source-verified corporate chronology was established in the inspected repository. The timeline is therefore reserved for verified records and is not populated with invented dates.' },
    ],
    aside: 'Historical records will distinguish original documents, sourced facts, testimony, interpretation and editorial commentary.',
  },
  leadership: {
    eyebrow: 'Governance',
    title: 'Leadership begins with accountability.',
    lede: 'The group leadership directory will identify approved officeholders, responsibilities and institutional appointments with clear dates and sources.',
    sections: [
      { title: 'Governance before presentation', body: 'Board, executive and institutional appointments must be confirmed by the founder and supported by appropriate corporate records before names or titles are published.' },
      { title: 'Institutional independence', body: 'Group leadership and the leadership of Ashcombe Private Bank and Vantoris Private Institution are distinct. A group role does not imply authority to execute another institution’s regulated or financial activities.' },
    ],
    aside: 'No individual leadership biographies or appointments are published in this release because a verified, approved directory was not present in the inspected source.',
  },
  institutions: {
    eyebrow: 'Institutional directory',
    title: 'Distinct institutions, connected by purpose.',
    lede: 'The Vantoris group is designed to coordinate independent institutions without collapsing their identities, records, finances or decision-making authority.',
    sections: [
      { title: 'Group Headquarters', body: 'Institutional Link is the designated headquarters platform for group governance, strategy, workforce coordination, reporting, research and authorised inter-institution coordination. Its code workspace is currently blocked by the Base44 workspace integration-credit limit.' },
      { title: 'Ashcombe Private Bank', body: 'Ashcombe is an independent private bank with its own public identity, client relationships, records, operations, approvals and financial authority. Its software and records remain in the separate Ashcombe repository.' },
      { title: 'Vantoris Private Institution', body: 'Vantoris Private Institution is a separate institution within the group. Its exact source application and service model must be verified before its capabilities are represented as live. It is not American Vanguard Credit Union.' },
    ],
    aside: 'Shared group infrastructure, where approved, does not create shared institutional permissions.',
  },
  'private-banking': {
    eyebrow: 'Private banking',
    title: 'Private banking with its own institutional authority.',
    lede: 'Ashcombe Private Bank is the group’s independent private-banking institution. Its client experience, financial records and operating decisions remain separate from Group Headquarters and Vantoris Private Institution.',
    sections: [
      { title: 'Private client relationships', body: 'The approved direction includes private-client administration, relationship management, wealth management, investments, treasury and client service. The bank’s own governance and legal review determine which services may be offered.' },
      { title: 'A controlled client experience', body: 'The intended digital experience includes secure client access, account information from authoritative records, statements, transaction history, secure documents, payment instructions, investment information, requests and relationship-manager communication.' },
      { title: 'Operational integrity', body: 'A payment instruction is not a payment settlement. Client balances, investment performance, provider connections and settlement states must be sourced from verified records and systems.' },
    ],
    aside: 'This group website does not open accounts, quote balances or claim that a banking provider or payment rail is connected.',
  },
  't-market': {
    eyebrow: 'T Market',
    title: 'A distinct market division, kept open to its verified purpose.',
    lede: 'T Market is preserved as a separate part of the Vantoris world. Its original business model could not be confirmed in the inspected project source.',
    sections: [
      { title: 'What is preserved', body: 'The approved scope reserves room for market identity and history, commercial research, industry and business profiles, commercial relationships, opportunities, market intelligence, agreements, reporting, growth and development.' },
      { title: 'What is not being invented', body: 'T Market is not being turned into a generic online shop, payments product or marketplace without the founder’s verified original specification.' },
      { title: 'Decision record', body: 'The precise purpose, audience, commercial model, transaction boundaries and operating workflows remain unresolved. The section remains visible and non-transactional until those details are recovered.' },
    ],
    aside: 'Founder decision required: confirm the original T Market purpose and approved operating model before transactional functionality is designed.',
  },
  research: {
    eyebrow: 'Research & intelligence',
    title: 'Evidence first. Interpretation clearly labelled.',
    lede: 'The research library is intended to support serious inquiry into economics, global finance, banking, private wealth, investment, business, entrepreneurship, geopolitics, history, technology and strategic risk.',
    sections: [
      { title: 'Research records', body: 'Each report should retain its author, publication date, source references, research category, review state, evidence quality and revision history.' },
      { title: 'Evidence discipline', body: 'Published material will distinguish sourced fact, opinion, disputed claims, hypotheses and forecasts. Market data must carry its source and timestamp; analytical signals are not guarantees.' },
      { title: 'Research archive', body: 'The archive is designed for searchable reports, researcher profiles, historical comparisons, publications and discovery. No fabricated research findings or live market feeds are displayed here.' },
    ],
    aside: 'No live market-data provider is claimed as connected by this public website.',
  },
  heritage: {
    eyebrow: 'Heritage & archive',
    title: 'Preserving the record. Respecting its provenance.',
    lede: 'The heritage archive will document financial history, merchant banking, private banking, institutions, entrepreneurs, industrialists, economic history, cultural heritage and the histories of the group’s own institutions.',
    sections: [
      { title: 'A source-led archive', body: 'Each item will retain its title, description, period, date where known, people and institutions, source documents, image rights, historical context, verification state, related stories, references and editorial history.' },
      { title: 'Separate historical collections', body: 'The Hambros Bank historical tribute remains a distinct historical collection. It does not imply ownership, succession, inheritance or an official relationship with Hambros Bank.' },
      { title: 'Editorial integrity', body: 'Contemporary architectural and library photographs used on this website are credited as editorial references. They are not presented as Vantoris property or as evidence of a historical event.' },
    ],
    aside: 'The archive will not pass AI-generated imagery off as documentary evidence or original historical photography.',
  },
  stories: {
    eyebrow: 'Stories & publications',
    title: 'Ideas, people and institutions—properly sourced.',
    lede: 'The publishing programme is intended to include articles, interviews, biographies, documentaries, business and founder stories, cultural essays, historical writing, books, audio stories and research publications.',
    sections: [
      { title: 'Editorial workflow', body: 'The publishing system is intended to support drafting, editing, author profiles, categories, source management, image rights, editorial approval, scheduling, revision history, search and archive.' },
      { title: 'Publication standard', body: 'Interviews, achievements, endorsements and personal stories will not be fabricated. Published work will distinguish fact, first-person testimony, opinion, analysis and fiction.' },
    ],
    aside: 'No articles or interviews are represented as published until a verified editorial record exists.',
  },
  spirituality: {
    eyebrow: 'Spirituality & philosophy',
    title: 'A respectful space for wisdom, belief and human purpose.',
    lede: 'This cultural and educational space is intended for the study of world religions, spiritual traditions, religious history, theology, philosophy, ethics, historical texts, sacred architecture, biographies, reflection and humanitarian service.',
    sections: [
      { title: 'Respectful inquiry', body: 'Different traditions and beliefs will be represented respectfully. Historical evidence, religious teaching, personal belief and interpretation will be clearly distinguished.' },
      { title: 'Education and reflection', body: 'The collection may include manuscripts, historical places, educational publications, meditation and reflection resources, and the study of ethics and purpose.' },
      { title: 'A firm institutional boundary', body: 'Religious belief or affiliation does not determine financial eligibility, employment, institutional access or the treatment of clients and staff.' },
    ],
    aside: 'This is an educational and cultural space, not an eligibility or access-control mechanism.',
  },
  careers: {
    eyebrow: 'Careers',
    title: 'Build institutions for the long term.',
    lede: 'The group’s careers area is intended to present verified opportunities across participating institutions while respecting each organisation’s own hiring authority.',
    sections: [
      { title: 'Independent hiring', body: 'Each institution owns its recruitment decisions, role requirements, employment records and approval process. Group coordination does not replace institutional hiring authority.' },
      { title: 'Current opportunities', body: 'No active vacancies or approved recruitment contacts were verified in the inspected project source. This page does not advertise fictional roles.' },
    ],
    aside: 'Official recruitment channels will be published when verified and authorised.',
  },
  news: {
    eyebrow: 'News & announcements',
    title: 'Only verified developments belong here.',
    lede: 'The news area will publish dated institutional announcements, approved updates, research releases and public notices with clear ownership and source records.',
    sections: [
      { title: 'Publication controls', body: 'Every announcement should have an accountable author, editorial owner, publication date, category, sources where applicable, review state and revision history.' },
      { title: 'Current publication state', body: 'No verified public announcements were identified in the inspected repository. This release therefore does not manufacture a news feed or claim recent achievements.' },
    ],
    aside: 'A quiet, accurate news page is preferable to a fabricated activity stream.',
  },
  contact: {
    eyebrow: 'Contact & official enquiries',
    title: 'The right enquiry should reach the right institution.',
    lede: 'Group enquiries, private-bank enquiries and Vantoris Private Institution enquiries must be routed to the appropriate organisation and handled under its own authority.',
    sections: [
      { title: 'Institutional routing', body: 'Group governance and corporate enquiries belong with Group Headquarters. Private-banking enquiries belong with Ashcombe Private Bank. Vantoris Private Institution enquiries must use its independently verified contact channel.' },
      { title: 'Contact details', body: 'No approved public postal address, telephone number or enquiry email was verified in the inspected source. Contact details will not be invented or routed to an unrelated institution.' },
    ],
    aside: 'Do not submit account credentials, identity documents or private financial information through this public website.',
  },
  legal: {
    eyebrow: 'Legal & disclosures',
    title: 'Clarity about identity, authority and status.',
    lede: 'The group website must distinguish public information from private records and must not imply regulatory approval, banking authorisation or operational capability without evidence.',
    sections: [
      { title: 'Institutional independence', body: 'Ashcombe Private Bank and Vantoris Private Institution retain separate legal, operational, financial and data boundaries. Group reporting does not combine independent ledgers.' },
      { title: 'Regulatory disclosures', body: 'No legal entity numbers, regulatory permissions, deposit-protection statements or provider arrangements are asserted on this page. Institution-specific disclosures require confirmation by the relevant institution.' },
      { title: 'Information status', body: 'Descriptions of planned capabilities are not representations that those capabilities are currently live, connected, approved or available to customers.' },
    ],
    aside: 'Legal identity and regulatory disclosures require founder and institution-level verification before final publication.',
  },
};

function PhotoCredit({ media }) {
  return (
    <figcaption className="vi-caption">
      <span>{media.caption}</span>
      <a href={media.source} target="_blank" rel="noreferrer">Photo: {media.photographer} / Unsplash</a>
    </figcaption>
  );
}

function ImageFigure({ media, className = '' }) {
  return (
    <figure className={className}>
      <img
        src={media.src}
        srcSet={media.srcSet}
        sizes="(max-width: 850px) 100vw, 50vw"
        alt={media.alt}
        loading="lazy"
        decoding="async"
      />
      <PhotoCredit media={media} />
    </figure>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="vi-topline">
        <div className="vi-shell">
          <span>Vantoris Private Institution Group</span>
          <span>Independent institutions · Coordinated purpose</span>
        </div>
      </div>
      <header className="vi-header">
        <div className="vi-shell vi-header-inner">
          <Link to="/" className="vi-brand" aria-label="Vantoris home" onClick={() => setOpen(false)}>
            <img src="/brand/vantoris-wordmark-horizontal.svg" alt="Vantoris Private Institution Group" />
          </Link>
          <nav className="vi-nav" aria-label="Primary navigation">
            {navigation.map(([label, to]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>
          <button className="vi-menu-button" type="button" aria-expanded={open} aria-controls="vi-mobile-navigation" onClick={() => setOpen(v => !v)}>
            {open ? <X size={16} /> : <Menu size={16} />}
            <span>{open ? 'Close' : 'Menu'}</span>
          </button>
          {open && (
            <nav id="vi-mobile-navigation" className="vi-mobile-menu" aria-label="Mobile navigation">
              {navigation.map(([label, to]) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="vi-footer">
      <div className="vi-shell">
        <div className="vi-footer-grid">
          <div>
            <img src="/brand/vantoris-wordmark-inverse.svg" alt="Vantoris Private Institution Group" />
            <p>Independent institutions, coordinated with discipline. Distinct identities, authority, records and responsibilities remain intact.</p>
          </div>
          <div>
            <h4>The Group</h4>
            <ul>
              <li><Link to="/about">About Vantoris</Link></li>
              <li><Link to="/history">Our History</Link></li>
              <li><Link to="/leadership">Leadership</Link></li>
              <li><Link to="/institutions">Institutions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Knowledge</h4>
            <ul>
              <li><Link to="/t-market">T Market</Link></li>
              <li><Link to="/research">Research & Intelligence</Link></li>
              <li><Link to="/heritage">Heritage</Link></li>
              <li><Link to="/stories">Stories & Publications</Link></li>
              <li><Link to="/spirituality">Spirituality & Philosophy</Link></li>
            </ul>
          </div>
          <div>
            <h4>Information</h4>
            <ul>
              <li><Link to="/private-banking">Private Banking</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/news">News</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/legal">Legal & Disclosures</Link></li>
            </ul>
          </div>
        </div>
        <div className="vi-footer-bottom">
          <span>© {new Date().getFullYear()} Vantoris Private Institution Group</span>
          <span>Public information · Institutional boundaries preserved</span>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <section className="vi-hero">
        <img className="vi-hero-image" src={institutionalMedia.architecture.src} alt={institutionalMedia.architecture.alt} loading="eager" />
        <div className="vi-shell vi-hero-content">
          <div className="vi-kicker">Vantoris Private Institution Group</div>
          <h1>An institutional world, built for the long view.</h1>
          <p>Independent institutions. Distinct responsibilities. A coordinated group shaped by governance, research, heritage and long-term ambition.</p>
          <div className="vi-actions">
            <Link className="vi-button" to="/institutions">Explore the institutions <ArrowUpRight size={14} /></Link>
            <Link className="vi-button vi-button-outline" to="/about">Discover Vantoris</Link>
          </div>
        </div>
        <div className="vi-photo-credit">Architectural reference: <a href={institutionalMedia.architecture.source} target="_blank" rel="noreferrer">Samuel Isaacs / Unsplash</a> · Oxford</div>
      </section>

      <section className="vi-shell vi-intro">
        <div>
          <div className="vi-kicker">Purpose & direction</div>
          <h2 className="vi-serif">Structure creates room for lasting work.</h2>
        </div>
        <div className="vi-intro-copy">
          <p>Vantoris is being developed as a coordinated institutional group—not as a single blended organisation. Group Headquarters provides governance and coordination while each institution retains its own identity, leadership, clients or members, records, finances and authority.</p>
          <p>Across the wider group, private banking, market intelligence, institutional development, history, research, publications and cultural inquiry are treated as distinct areas of work, connected through clear governance and accountable stewardship.</p>
        </div>
      </section>

      <section className="vi-section vi-section-ivory">
        <div className="vi-shell">
          <div className="vi-section-heading">
            <div><div className="vi-kicker">Institutional directory</div><h2>Three distinct centres of responsibility.</h2></div>
            <p>Coordination does not transfer institutional authority. Each organisation remains responsible for its own decisions and records.</p>
          </div>
          <div className="vi-grid-3">
            <article className="vi-card">
              <div><div className="vi-card-number">01 / GROUP HEADQUARTERS</div><h3>Institutional Link</h3><p>Group governance, strategy, workforce coordination, reporting and approved inter-institution services.</p></div>
              <Link className="vi-card-link" to="/institutions">Headquarters overview <span>↗</span></Link>
            </article>
            <article className="vi-card">
              <div><div className="vi-card-number">02 / INDEPENDENT BANK</div><h3>Ashcombe Private Bank</h3><p>A separate private bank with its own clients, records, banking operations, approvals and financial authority.</p></div>
              <Link className="vi-card-link" to="/private-banking">Private banking <span>↗</span></Link>
            </article>
            <article className="vi-card">
              <div><div className="vi-card-number">03 / INDEPENDENT INSTITUTION</div><h3>Vantoris Private Institution</h3><p>A distinct institution whose source application and exact service model must be verified before capabilities are described as operational.</p></div>
              <Link className="vi-card-link" to="/institutions">Institutional overview <span>↗</span></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="vi-section">
        <div className="vi-shell vi-media-split">
          <ImageFigure media={institutionalMedia.ledger} />
          <div className="vi-media-copy">
            <div className="vi-kicker">Research & intelligence</div>
            <h2>Knowledge with provenance.</h2>
            <p>Research across economics, banking, private wealth, investment, entrepreneurship, markets, geopolitics, history and technology should be sourced, dated and reviewed. Facts, opinion, disputed claims and forecasts remain visibly distinct.</p>
            <Link className="vi-card-link" to="/research">Explore research <span>↗</span></Link>
          </div>
        </div>
      </section>

      <section className="vi-section vi-section-dark">
        <div className="vi-shell">
          <div className="vi-section-heading">
            <div><div className="vi-kicker">A wider institutional world</div><h2>Different disciplines. One long horizon.</h2></div>
            <p>Each division has a distinct purpose and will be developed against verified specifications, appropriate governance and clear operating boundaries.</p>
          </div>
          <div className="vi-grid-3">
            {[
              ['T Market', 'A distinct market division. Its original business model remains under verification.', '/t-market'],
              ['Heritage & History', 'A source-led archive of institutions, people, places, documents and cultural history.', '/heritage'],
              ['Stories & Publications', 'Editorial work with authorship, sources, image rights and review history.', '/stories'],
              ['Spirituality & Philosophy', 'Respectful educational inquiry into belief, ethics, wisdom and human purpose.', '/spirituality'],
              ['Private Banking', 'Ashcombe’s independent private-banking institution and client experience.', '/private-banking'],
              ['Group Strategy', 'Long-term institutional development, governance and approved shared services.', '/about'],
            ].map(([title, body, to], index) => (
              <article className="vi-card" key={title}>
                <div><div className="vi-card-number">0{index + 1} / VANTORIS</div><h3>{title}</h3><p>{body}</p></div>
                <Link className="vi-card-link" to={to}>Explore <span>↗</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vi-section vi-section-ivory">
        <div className="vi-shell vi-archive-grid">
          <ImageFigure media={institutionalMedia.readingRoom} className="vi-archive-image" />
          <div className="vi-archive-side">
            <div className="vi-card">
              <div><div className="vi-kicker">Heritage & continuity</div><h3>History deserves evidence.</h3><p>Timelines, biographies, documents and images will retain source, period, rights, context and verification status.</p></div>
              <Link className="vi-card-link" to="/heritage">Enter the archive <span>↗</span></Link>
            </div>
            <div className="vi-note"><strong>Separate historical collection</strong>The Hambros Bank tribute is maintained as an independent historical collection. It does not imply ownership, succession, inheritance or an official relationship.</div>
          </div>
        </div>
      </section>

      <section className="vi-section">
        <div className="vi-shell vi-media-split">
          <div className="vi-media-copy">
            <div className="vi-kicker">Leadership & governance</div>
            <h2>Authority should be clear before it is displayed.</h2>
            <p>Board and leadership information will be published from approved records. Institutional roles, delegations and decision rights remain separate across Group Headquarters, Ashcombe Private Bank and Vantoris Private Institution.</p>
            <div className="vi-empty">The public leadership directory is awaiting verified, founder-approved appointments. No names or titles are invented for this release.</div>
            <Link className="vi-card-link" to="/leadership">Governance & leadership <span>↗</span></Link>
          </div>
          <ImageFigure media={institutionalMedia.collection} />
        </div>
      </section>

      <section className="vi-section vi-section-ivory">
        <div className="vi-shell">
          <div className="vi-section-heading">
            <div><div className="vi-kicker">News & milestones</div><h2>Progress, recorded accurately.</h2></div>
            <p>Public achievements and announcements require a date, source, owner and review state.</p>
          </div>
          <div className="vi-grid-3">
            <article className="vi-card"><div><div className="vi-card-number">NEWSROOM</div><h3>No verified announcements yet.</h3><p>The public newsroom will publish only approved and dated institutional updates.</p></div><Link className="vi-card-link" to="/news">Newsroom <span>↗</span></Link></article>
            <article className="vi-card"><div><div className="vi-card-number">GROWTH & DEVELOPMENT</div><h3>Build with evidence.</h3><p>Institutional milestones will be recorded as founded, approved, developed, tested, published, launched or expanded only when supported by evidence.</p></div><Link className="vi-card-link" to="/history">Our history <span>↗</span></Link></article>
            <article className="vi-card"><div><div className="vi-card-number">OPPORTUNITIES</div><h3>Careers and contribution.</h3><p>Opportunities will be published when a participating institution has approved a genuine opening and its application channel.</p></div><Link className="vi-card-link" to="/careers">Careers <span>↗</span></Link></article>
          </div>
        </div>
      </section>

      <section className="vi-section vi-section-dark">
        <div className="vi-shell vi-media-split">
          <div className="vi-media-copy">
            <div className="vi-kicker">A considered future</div>
            <h2>Ambition, grounded in institutional discipline.</h2>
            <p>The group’s future direction is to develop independent institutions, thoughtful research, meaningful archives and responsible shared capabilities. Growth will be reported from validated records—not invented figures or activity indicators.</p>
            <Link className="vi-button" to="/about">About the group <ArrowUpRight size={14} /></Link>
          </div>
          <div className="vi-quote">“A connected group is strongest when every institution knows where its responsibility begins—and where it ends.”</div>
        </div>
      </section>
    </>
  );
}

function EditorialPage({ page }) {
  return (
    <main className="vi-editorial vi-shell">
      <div className="vi-breadcrumb"><Link to="/">Vantoris</Link> / {page.eyebrow}</div>
      <div className="vi-kicker">{page.eyebrow}</div>
      <h1>{page.title}</h1>
      <p className="vi-editorial-lede">{page.lede}</p>
      <div className="vi-editorial-layout">
        <div className="vi-editorial-main">
          {page.sections.map(section => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          {page.eyebrow === 'Heritage & archive' && <ImageFigure media={institutionalMedia.readingRoom} />}
          {page.eyebrow === 'Research & intelligence' && <ImageFigure media={institutionalMedia.library} />}
          {page.eyebrow === 'History & continuity' && <ImageFigure media={institutionalMedia.collection} />}
          {page.eyebrow === 'T Market' && <div className="vi-note"><strong>Founder decision recorded</strong>The T Market business model is unresolved. This page remains informational and does not create listings, checkout, payment or transaction functionality.</div>}
        </div>
        <aside className="vi-editorial-aside">
          <h3>Institutional note</h3>
          <p>{page.aside}</p>
          <p>Descriptions on this site distinguish current verified records from planned development and unresolved decisions.</p>
        </aside>
      </div>
    </main>
  );
}

export default function InstitutionalSite() {
  const location = useLocation();
  const key = location.pathname === '/' ? 'home' : location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const page = pages[key];
  return (
    <div className="vi-site">
      <a className="sr-only focus:not-sr-only" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">
        {key === 'home' ? <HomePage /> : page ? <EditorialPage page={page} /> : (
          <section className="vi-shell vi-editorial">
            <div className="vi-kicker">Not found</div>
            <h1>That page is not part of this public directory.</h1>
            <p className="vi-editorial-lede">Return to the Vantoris company home to explore the institutional directory.</p>
            <Link className="vi-button" to="/">Return home</Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
