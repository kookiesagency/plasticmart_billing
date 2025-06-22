'use client'
import { SetHeader } from '@/components/layout/header-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <>
      <SetHeader title="Dashboard" />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          {/* Add more cards here as needed */}
        </div>
        <div>
          {/* Additional dashboard components can go here */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Smart Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is your main dashboard. Use the sidebar to navigate to different sections of the application.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
