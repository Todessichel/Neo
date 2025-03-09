import React from 'react';

interface OKRDocumentProps {
  content: React.ReactNode;
}

const OKRDocument: React.FC<OKRDocumentProps> = ({ content }) => {
  // Default content if none is provided
  const defaultContent = (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">OKRs - NEO</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Objective 1: Achieve €100K in Total First-Year Revenue</h3>
        <p className="italic mb-2">Rationale: Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.</p>
        <ul className="list-disc pl-5">
          <li>KR1: Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.</li>
          <li>KR2: Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.</li>
          <li>KR3: Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.</li>
          <li>KR4: Maintain an average revenue per user (ARPU) of at least €80 across all paying subscribers in Year 1.</li>
          <li>KR5: Maintain an average 30-day sales cycle (from lead to closed deal) or less for B2B pilot offerings.</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Objective 2: Grow Subscription Base & Reduce Churn</h3>
        <p className="italic mb-2">Rationale: Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.</p>
        <ul className="list-disc pl-5">
          <li>KR1: Reach 300 total paying subscribers by end of Year 1 (across all tiers).</li>
          <li>KR2: Maintain a monthly churn rate below 5% after the first 3 months of launch.</li>
          <li>KR3: Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.</li>
          <li>KR4: Achieve ≥ 20% subscription upgrades (e.g., from Basic to Pro or Enterprise) by end of Year 1.</li>
          <li>KR5: Limit free trial to paid conversion time to a median of 10 days or fewer.</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Objective 3: Deliver Exceptional Customer Satisfaction & ROI</h3>
        <p className="italic mb-2">Rationale: Differentiate NEO through quality user experience, robust strategic insights, and clear value—driving long-term loyalty and word-of-mouth.</p>
        <ul className="list-disc pl-5">
          <li>KR1: Maintain a Customer Satisfaction Score ≥ 90% across all paying tiers (via quarterly surveys).</li>
          <li>KR2: Attain an NPS (Net Promoter Score) ≥ 50 by Year 1, indicating strong brand advocacy.</li>
          <li>KR3: Log at least 10 verified ROI case studies (e.g., cost savings, revenue growth, successful pivots) from Pro/Enterprise clients.</li>
          <li>KR4: Time-to-Value under 14 days for new signups—measure how quickly new users complete a meaningful strategic/financial scenario.</li>
          <li>KR5: Achieve a &lt;24-hour average response time for Enterprise-tier support tickets (and &lt;48 hours for all tiers).</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Objective 4: Strengthen Market Presence & Channel Partnerships</h3>
        <p className="italic mb-2">Rationale: Leverage strategic alliances and targeted marketing to efficiently attract leads who can afford higher-tier subscriptions.</p>
        <ul className="list-disc pl-5">
          <li>KR1: Establish 2–3 formal accelerator or VC network partnerships that onboard at least 50 total Basic/Pro subscribers within the first 6 months.</li>
          <li>KR2: Generate >1,000 qualified leads from LinkedIn Ads, webinars, and direct outreach by the end of Year 1.</li>
          <li>KR3: Host a bi-weekly "NEO Live Demo" webinar with an average of 50+ attendees each, converting ≥10% to paying subscribers.</li>
          <li>KR4: Secure 5 external blog posts or press mentions highlighting NEO's unique AI-driven strategy + finance approach.</li>
          <li>KR5: Participate as a speaker or sponsor in 3 industry events or startup conferences, building brand credibility.</li>
        </ul>
      </div>
    </div>
  );

  return content || defaultContent;
};

export default OKRDocument;