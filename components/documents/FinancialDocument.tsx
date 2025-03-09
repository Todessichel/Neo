import React from 'react';

interface FinancialDocumentProps {
  content: React.ReactNode;
}

const FinancialDocument: React.FC<FinancialDocumentProps> = ({ content }) => {
  // Default content if none is provided
  const defaultContent = (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Financial Projection - NEO</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Revenue Streams</h3>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Subscription Tier</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Year 1 Target</th>
              <th className="border p-2">Year 1 Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Basic</td>
              <td className="border p-2">€49/mo</td>
              <td className="border p-2">180 subscribers</td>
              <td className="border p-2">€105,840</td>
            </tr>
            <tr>
              <td className="border p-2">Pro</td>
              <td className="border p-2">€99/mo</td>
              <td className="border p-2">90 subscribers</td>
              <td className="border p-2">€106,920</td>
            </tr>
            <tr>
              <td className="border p-2">Enterprise</td>
              <td className="border p-2">€299/mo</td>
              <td className="border p-2">30 subscribers</td>
              <td className="border p-2">€107,640</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border p-2 font-medium">Total Subscription</td>
              <td className="border p-2"></td>
              <td className="border p-2">300 subscribers</td>
              <td className="border p-2 font-medium">€320,400</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Pilot Engagements</h3>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Engagement Type</th>
              <th className="border p-2">Price Range</th>
              <th className="border p-2">Year 1 Target</th>
              <th className="border p-2">Year 1 Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Strategy Accelerator</td>
              <td className="border p-2">€5,000 - €10,000</td>
              <td className="border p-2">8-10 deals</td>
              <td className="border p-2">€60,000 - €80,000</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Cost Structure</h3>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Cost Category</th>
              <th className="border p-2">Monthly</th>
              <th className="border p-2">Annual</th>
              <th className="border p-2">% of Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Development</td>
              <td className="border p-2">€12,000</td>
              <td className="border p-2">€144,000</td>
              <td className="border p-2">36%</td>
            </tr>
            <tr>
              <td className="border p-2">Marketing</td>
              <td className="border p-2">€5,000</td>
              <td className="border p-2">€60,000</td>
              <td className="border p-2">15%</td>
            </tr>
            <tr>
              <td className="border p-2">Operations</td>
              <td className="border p-2">€3,000</td>
              <td className="border p-2">€36,000</td>
              <td className="border p-2">9%</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border p-2 font-medium">Total Costs</td>
              <td className="border p-2 font-medium">€20,000</td>
              <td className="border p-2 font-medium">€240,000</td>
              <td className="border p-2 font-medium">60%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Projected Profitability</h3>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Category</th>
              <th className="border p-2">Year 1</th>
              <th className="border p-2">Year 2</th>
              <th className="border p-2">Year 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Total Revenue</td>
              <td className="border p-2">€400,000</td>
              <td className="border p-2">€800,000</td>
              <td className="border p-2">€1,600,000</td>
            </tr>
            <tr>
              <td className="border p-2">Total Costs</td>
              <td className="border p-2">€240,000</td>
              <td className="border p-2">€400,000</td>
              <td className="border p-2">€720,000</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border p-2 font-medium">Net Profit</td>
              <td className="border p-2 font-medium">€160,000</td>
              <td className="border p-2 font-medium">€400,000</td>
              <td className="border p-2 font-medium">€880,000</td>
            </tr>
            <tr>
              <td className="border p-2">Profit Margin</td>
              <td className="border p-2">40%</td>
              <td className="border p-2">50%</td>
              <td className="border p-2">55%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return content || defaultContent;
};

export default FinancialDocument;