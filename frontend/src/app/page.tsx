'use client';

import { useState } from 'react';
import Image from "next/image";

interface QueryResult {
  columns: string[];
  rows: any[];
  table_name?: string;
}

interface DatabaseConnection {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

type PredefinedQueries = {
  [key: string]: string;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<QueryResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<DatabaseConnection>({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'xyz_company'
  });

  const predefinedQueries: PredefinedQueries = {
    "Interviewers for Hellen Cole (Job 11111)": "SELECT DISTINCT i.InterviewerID, p.LastName, p.FirstName FROM InterviewerAssignment i JOIN Interview iv ON i.InterviewID = iv.InterviewID JOIN JobPosition jp ON iv.JobID = jp.JobID JOIN Person p ON i.InterviewerID = p.PersonID WHERE iv.CandidateID = (SELECT PersonID FROM Person WHERE FirstName = 'Hellen' AND LastName = 'Cole') AND jp.JobID = 11111;",
    "Jobs posted by Marketing (January 2011)": "SELECT j.JobID FROM JobPosition j JOIN Department d ON j.DepartmentID = d.Department_ID WHERE d.DepartmentName = 'Marketing' AND j.PostedDate >= '2011-01-01' AND j.PostedDate < '2011-02-01';",
    "Employees with no supervisees": "SELECT e.PersonID, CONCAT(p.FirstName, ' ', p.LastName) AS Name FROM Employee e JOIN Person p ON e.PersonID = p.PersonID WHERE e.PersonID NOT IN (SELECT SupervisorID FROM Employee WHERE SupervisorID IS NOT NULL);",
    "Marketing sites with no sales (March 2011)": "SELECT s.SiteID, s.Location FROM Site s JOIN Department d ON d.DepartmentName = 'Marketing' WHERE s.SiteID NOT IN (SELECT SiteID FROM Sale WHERE SalesTime BETWEEN '2011-03-01' AND '2011-03-31');",
    "Jobs with no hires after 1 month of posting": "SELECT jp.JobID, jp.JobDescription FROM JobPosition jp WHERE NOT EXISTS (SELECT 1 FROM Application a WHERE a.JobID = jp.JobID AND a.ApplicationDate <= DATE_ADD(jp.PostedDate, INTERVAL 1 MONTH) AND a.Status = 'Selected');",
    "Salespeople who sold all products > $200": "SELECT sp.PersonID, CONCAT(p.FirstName, ' ', p.LastName) AS Name FROM Employee sp JOIN Person p ON sp.PersonID = p.PersonID WHERE NOT EXISTS (SELECT pt.ProductType FROM Product pt WHERE pt.ListPrice > 200 AND pt.ProductType NOT IN (SELECT DISTINCT pr.ProductType FROM Sale s JOIN Product pr ON s.ProductID = pr.ProductID WHERE s.SalesPersonID = sp.PersonID));",
    "Departments with no job posts (Jan-Feb 2011)": "SELECT d.Department_ID, d.DepartmentName FROM Department d WHERE d.Department_ID NOT IN (SELECT jp.DepartmentID FROM JobPosition jp WHERE jp.PostedDate BETWEEN '2011-01-01' AND '2011-02-28');",
    "Employees applying for job 12345": "SELECT e.PersonID AS EmployeeID, CONCAT(p.FirstName, ' ', p.LastName) AS Name, ed.DepartmentID FROM Employee e JOIN Person p ON e.PersonID = p.PersonID JOIN Application a ON e.PersonID = a.ApplicantID JOIN JobPosition jp ON a.JobID = jp.JobID LEFT JOIN EmployeeDepartmentAssignment ed ON e.PersonID = ed.EmployeeID WHERE jp.JobID = 12345;",
    "Best seller's type": "SELECT pt.Type AS EmployeeType, COUNT(*) AS TotalSales FROM Sale s JOIN Employee e ON s.SalesPersonID = e.PersonID JOIN PersonType pt ON e.PersonID = pt.PersonID WHERE pt.Type = 'Employee' GROUP BY pt.Type ORDER BY TotalSales DESC LIMIT 1;",
    "Product type with highest net profit": "SELECT pr.ProductType FROM Product pr JOIN ProductPart pp ON pr.ProductID = pp.ProductID JOIN VendorPart vp ON pp.PartID = vp.PartID GROUP BY pr.ProductType ORDER BY (SUM(pr.ListPrice) - SUM(vp.Price)) DESC LIMIT 1;",
    "Employees working in all departments": "SELECT e.EmployeeID AS PersonID, p.LastName, p.FirstName FROM EmployeeDepartmentAssignment e JOIN Person p ON e.EmployeeID = p.PersonID GROUP BY e.EmployeeID, p.LastName, p.FirstName HAVING COUNT(DISTINCT e.DepartmentID) = (SELECT COUNT(*) FROM Department);",
    "Interviewees selected (name and email)": "SELECT CONCAT(p.FirstName, ' ', p.LastName) AS IntervieweeName, p.Email AS EmailAddress FROM Interview i JOIN Person p ON i.CandidateID = p.PersonID WHERE EXISTS (SELECT 1 FROM InterviewGrade ig WHERE ig.InterviewID = i.InterviewID AND ig.Grade >= 70 GROUP BY ig.InterviewID HAVING COUNT(DISTINCT ig.RoundNumber) >= 5);",
    "Interviewees (name, phone, email)": "SELECT p.FirstName, p.LastName, ph.PhoneNumber, p.Email FROM Person p JOIN PhoneNumber ph ON p.PersonID = ph.PersonID JOIN Interview i ON p.PersonID = i.CandidateID WHERE EXISTS (SELECT 1 FROM InterviewGrade ig WHERE ig.InterviewID = i.InterviewID AND ig.Grade >= 70 GROUP BY ig.InterviewID HAVING COUNT(DISTINCT ig.RoundNumber) >= 5);",
    "Employee with highest average salary": "SELECT p.PersonID, p.FirstName, p.LastName FROM Person p JOIN Salary s ON p.PersonID = s.EmployeeID GROUP BY s.EmployeeID ORDER BY AVG(s.Amount) DESC LIMIT 1;",
    "Vendor supplying 'Cup' (lowest price)": "SELECT v.VendorID, v.Name AS VendorName FROM Vendor v JOIN VendorPart vp ON v.VendorID = vp.VendorID JOIN Part p ON vp.PartID = p.PartID JOIN Product pr ON p.ProductID = pr.ProductID WHERE pr.ProductType = 'Cup' AND pr.Weight < 4 AND vp.Price = (SELECT MIN(vp2.Price) FROM VendorPart vp2 JOIN Part p2 ON vp2.PartID = p2.PartID JOIN Product pr2 ON p2.ProductID = pr2.ProductID WHERE pr2.ProductType = 'Cup' AND pr2.Weight < 4);",
    "View: Employee Average Monthly Salaries": "SELECT * FROM EmployeeAverageSalary ORDER BY AverageMonthlySalary DESC;",
    "View: Interview Rounds Passed": "SELECT * FROM InterviewRoundsPassed WHERE PassedRounds >= 5 ORDER BY PassedRounds DESC;",
    "View: Product Type Sales": "SELECT * FROM ProductTypeSales ORDER BY TotalItemsSold DESC;",
    "View: Product Part Costs": "SELECT * FROM ProductPartCost ORDER BY TotalPartCost DESC;"
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionDetails),
      });
      
      if (response.ok) {
        setConnected(true);
        setSuccessMessage('Connected to the database.');
        setErrorMessage(null);
      } else {
        const error = await response.json();
        setErrorMessage(error.message);
        setSuccessMessage(null);
      }
    } catch (error) {
      setErrorMessage('Failed to connect to the database.');
      setSuccessMessage(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setConnected(false);
        setSuccessMessage('Disconnected from the database.');
        setErrorMessage(null);
        setData([]);
      }
    } catch (error) {
      setErrorMessage('Failed to disconnect from the database.');
      setSuccessMessage(null);
    }
  };

  const handleShowTables = async () => {
    try {
      const response = await fetch('/api/tables');
      const result = await response.json();
      setData(result);
      setSuccessMessage('Tables and data fetched successfully.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to fetch tables.');
      setSuccessMessage(null);
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedQuery) return;
    
    try {
      setErrorMessage(null);
      console.log("Executing query:", predefinedQueries[selectedQuery]);
      
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: predefinedQueries[selectedQuery] }),
      });
      
      const result = await response.json();
      console.log("Query result:", result);
      
      if (result.message) {
        // This is likely an error message from the API
        setErrorMessage(result.message);
        return;
      }
      
      setData([result]);
      setSuccessMessage('Query executed successfully.');
      setErrorMessage(null);
    } catch (error) {
      console.error("Query execution error:", error);
      setErrorMessage('Failed to execute query. See console for details.');
      setSuccessMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            XYZ Company Database
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful data insights for your organization
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 mb-10 backdrop-blur-sm bg-opacity-90 border border-gray-100">
          {!connected ? (
            <form onSubmit={handleConnect} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                    Host
                  </label>
                  <input
                    type="text"
                    id="host"
                    value={connectionDetails.host}
                    onChange={(e) => setConnectionDetails({...connectionDetails, host: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                    Port
                  </label>
                  <input
                    type="text"
                    id="port"
                    value={connectionDetails.port}
                    onChange={(e) => setConnectionDetails({...connectionDetails, port: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                    User
                  </label>
                  <input
                    type="text"
                    id="user"
                    value={connectionDetails.user}
                    onChange={(e) => setConnectionDetails({...connectionDetails, user: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={connectionDetails.password}
                    onChange={(e) => setConnectionDetails({...connectionDetails, password: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="database" className="block text-sm font-medium text-gray-700">
                    Database
                  </label>
                  <input
                    type="text"
                    id="database"
                    value={connectionDetails.database}
                    onChange={(e) => setConnectionDetails({...connectionDetails, database: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.01]"
              >
                Connect
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-[1.01]"
                >
                  Disconnect
                </button>
                <button
                  onClick={handleShowTables}
                  className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-[1.01]"
                >
                  Show Tables
                </button>
              </div>

              <div className="space-y-4">
                <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                  Select Query
                </label>
                <select
                  id="query"
                  value={selectedQuery}
                  onChange={(e) => setSelectedQuery(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all bg-white"
                >
                  <option value="">Select a query...</option>
                  {Object.keys(predefinedQueries).map((queryName) => (
                    <option key={queryName} value={queryName}>
                      {queryName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExecuteQuery}
                  disabled={!selectedQuery}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                >
                  Execute Query
                </button>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-400 p-5 rounded-lg mb-10 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-5 rounded-lg mb-10 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add this for debugging */}
        {/* 
        {data && data.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Debug: Raw Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        */}

        {data.map((table, index) => (
          <div key={index} className="bg-white shadow-xl rounded-2xl p-8 mb-10 backdrop-blur-sm bg-opacity-90 border border-gray-100 overflow-hidden transition-all hover:shadow-2xl">
            {table.table_name && (
              <h2 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3">
                <span className="text-blue-600">{table.table_name}</span>
              </h2>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {table.columns && Array.isArray(table.columns) && table.columns.map((column, colIndex) => (
                      <th
                        key={colIndex}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.rows && Array.isArray(table.rows) && table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {table.columns && Array.isArray(table.columns) && table.columns.map((column, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                        >
                          {row[column] != null ? row[column].toString() : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
