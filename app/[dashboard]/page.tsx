import { notFound } from 'next/navigation';

const dashboardLinks: { [key: string]: string } = {
  manipur: 'https://mn-data.10bedicu.in/public/dashboard/a2b651c2-51b1-4948-b84c-889e2a5e9dba?date_range=&hub=&hospital_name=',
  assam: 'https://caredata.assam.gov.in/public/dashboard/31925fb9-29a8-40ec-b210-92bc2577af11?date_range=&hub=&hospital_name=',
  karnataka: 'https://caredata.karnataka.care/public/dashboard/2b2bd976-e234-44d0-8114-7d5684d891f9?date_range=&hub=&hospital_name=',
  meghalaya: 'https://caredata.meghealth.gov.in/public/dashboard/3eb879a2-92d2-4899-b9e8-2c5caeb766a5?date_range=&hub=&hospital_name=',
  sikkim: 'https://sk-data.10bedicu.in/public/dashboard/ca658e64-cc0d-405c-90b6-b0fecf23e06e?date_range=&hub=&hospital_name=',
  nagaland: 'https://caredata.nagaland.gov.in/public/dashboard/04ffb6eb-4d28-4dab-8842-68901fd0876f?date_range=&hub=&hospital_name='
};

export default function DashboardPage({ params }: { params: { dashboard: string } }) {
  const dashboardLink = dashboardLinks[params.dashboard];

  if (!dashboardLink) {
    notFound(); // Display a 404 page if the dashboard does not exist
  }

  return (
    <div style={{ height: '100vh' }}>
      <iframe
        src={dashboardLink}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title={`${params.dashboard} dashboard`}
      />
    </div>
  );
}
