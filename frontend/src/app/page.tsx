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

interface CrudOperation {
  operation: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: Record<string, any>;
  where?: Record<string, any>;
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

  // CRUD state
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [operation, setOperation] = useState<'create' | 'read' | 'update' | 'delete'>('read');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [whereConditions, setWhereConditions] = useState<Record<string, any>>({});
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [crudResult, setCrudResult] = useState<any>(null);
  
  // Enhanced CRUD state
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [editedRow, setEditedRow] = useState<any>(null);
  const [selectedRowsForDelete, setSelectedRowsForDelete] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
      
      // Extract table names for CRUD operations
      const tableNames = result.map((table: any) => table.table_name);
      setTables(tableNames);
      
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

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setFormData({});
    setWhereConditions({});
    setSelectedRow(null);
    setEditedRow(null);
    setSelectedRowsForDelete(new Set());
    setIsEditing(false);
    
    if (tableName) {
      try {
        // Get table structure to know what fields are available
        const tableInfo = data.find((table) => table.table_name === tableName);
        if (tableInfo && tableInfo.columns) {
          setTableColumns(tableInfo.columns);
        }
        
        // Fetch all rows for the selected table
        const response = await fetch('/api/crud', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'read',
            table: tableName
          }),
        });
        
        const result = await response.json();
        if (result.records && Array.isArray(result.records)) {
          setTableRows(result.records);
        }
        
        // For read operation, set the result
        if (operation === 'read') {
          setCrudResult(result);
        }
      } catch (error) {
        console.error("Error selecting table:", error);
      }
    }
  };
  
  const handleOperationChange = (op: 'create' | 'read' | 'update' | 'delete') => {
    setOperation(op);
    setCrudResult(null);
    setSelectedRow(null);
    setEditedRow(null);
    setSelectedRowsForDelete(new Set());
    setIsEditing(false);
    
    // Clear form data when changing operations
    if (op === 'create') {
      setWhereConditions({});
    } else if (op === 'read') {
      setFormData({});
    }
    
    // If we already have a table selected, fetch its data
    if (selectedTable && (op === 'read' || op === 'update' || op === 'delete')) {
      handleTableSelect(selectedTable);
    }
  };
  
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleWhereChange = (field: string, value: string) => {
    setWhereConditions(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleRowSelect = (row: any, index: number) => {
    if (operation === 'update') {
      setSelectedRow(row);
      setEditedRow({...row});
      setIsEditing(true);
    } else if (operation === 'delete') {
      const newSelectedRows = new Set(selectedRowsForDelete);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      setSelectedRowsForDelete(newSelectedRows);
    }
  };
  
  const handleEditChange = (field: string, value: string) => {
    setEditedRow((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleUpdateConfirm = async () => {
    if (!selectedRow || !editedRow) return;
    
    try {
      // Determine the primary key fields (this is a simplification - in real app you'd know your schema)
      const primaryKeyFields = Object.keys(selectedRow).filter(key => 
        key.toLowerCase().includes('id') || key === 'id' || key.endsWith('ID')
      );
      
      // If no obvious primary key, use all fields for the where clause
      const whereFields = primaryKeyFields.length > 0 ? primaryKeyFields : Object.keys(selectedRow);
      
      const whereConditions: Record<string, any> = {};
      whereFields.forEach(field => {
        whereConditions[field] = selectedRow[field];
      });
      
      // Remove primary key fields from data if they exist there too
      const updateData = {...editedRow};
      primaryKeyFields.forEach(field => {
        delete updateData[field];
      });
      
      const response = await fetch('/api/crud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'update',
          table: selectedTable,
          data: updateData,
          where: whereConditions
        }),
      });
      
      const result = await response.json();
      console.log("Update result:", result);
      
      if (result.message && response.status >= 400) {
        setErrorMessage(result.message);
        return;
      }
      
      setCrudResult(result);
      setSuccessMessage(`Record updated successfully.`);
      setIsEditing(false);
      
      // Refresh the table data
      handleTableSelect(selectedTable);
      
    } catch (error) {
      console.error("Update error:", error);
      setErrorMessage('Failed to update record. See console for details.');
      setSuccessMessage(null);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedRowsForDelete.size === 0) {
      setErrorMessage('Please select at least one row to delete.');
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedRowsForDelete).map(async (index) => {
        const rowToDelete = tableRows[index];
        
        // Determine the primary key fields (simplification)
        const primaryKeyFields = Object.keys(rowToDelete).filter(key => 
          key.toLowerCase().includes('id') || key === 'id' || key.endsWith('ID')
        );
        
        // If no obvious primary key, use all fields for the where clause
        const whereFields = primaryKeyFields.length > 0 ? primaryKeyFields : Object.keys(rowToDelete);
        
        const whereConditions: Record<string, any> = {};
        whereFields.forEach(field => {
          whereConditions[field] = rowToDelete[field];
        });
        
        return fetch('/api/crud', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'delete',
            table: selectedTable,
            where: whereConditions
          }),
        });
      });
      
      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      const totalDeleted = results.reduce((acc, result) => acc + result.affectedRows, 0);
      
      setCrudResult({
        message: `${totalDeleted} record(s) deleted successfully`,
        deletedRecords: results.flatMap(result => result.deletedRecords || [])
      });
      
      setSuccessMessage(`${totalDeleted} record(s) deleted successfully.`);
      setSelectedRowsForDelete(new Set());
      
      // Refresh the table data
      handleTableSelect(selectedTable);
      
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage('Failed to delete records. See console for details.');
      setSuccessMessage(null);
    }
  };
  
  const handleCrudOperation = async () => {
    if (!selectedTable) {
      setErrorMessage('Please select a table first.');
      return;
    }
    
    // For update and delete, we use the specialized handlers
    if (operation === 'update' && isEditing) {
      return handleUpdateConfirm();
    }
    
    if (operation === 'delete' && selectedRowsForDelete.size > 0) {
      return handleDeleteConfirm();
    }
    
    try {
      setErrorMessage(null);
      
      const crudRequest: CrudOperation = {
        operation,
        table: selectedTable,
      };
      
      // Add data and where conditions based on operation
      if (operation === 'create') {
        crudRequest.data = formData;
      }
      
      if (operation === 'read') {
        crudRequest.where = Object.keys(whereConditions).length > 0 ? whereConditions : undefined;
      }
      
      console.log("Executing CRUD operation:", crudRequest);
      
      const response = await fetch('/api/crud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crudRequest),
      });
      
      const result = await response.json();
      console.log("CRUD result:", result);
      
      if (result.message && response.status >= 400) {
        // This is likely an error message from the API
        setErrorMessage(result.message);
        return;
      }
      
      setCrudResult(result);
      setSuccessMessage(`${operation.charAt(0).toUpperCase() + operation.slice(1)} operation executed successfully.`);
      
      // Clear form after successful create
      if (operation === 'create') {
        setFormData({});
        // Refresh the table data
        handleTableSelect(selectedTable);
      }
      
    } catch (error) {
      console.error("CRUD operation error:", error);
      setErrorMessage('Failed to execute operation. See console for details.');
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
                <div className="flex space-x-4">
                  <div className="flex-1">
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
                  </div>
                  <div className="flex-none pt-7">
                <button
                  onClick={handleExecuteQuery}
                  disabled={!selectedQuery}
                      className="py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                >
                  Execute Query
                </button>
              </div>
                </div>
              </div>
              
              {/* CRUD Interface */}
              <div className="mt-10 border-t pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">CRUD Operations</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="table" className="block text-sm font-medium text-gray-700">
                        Select Table
                      </label>
                      <select
                        id="table"
                        value={selectedTable}
                        onChange={(e) => handleTableSelect(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all bg-white"
                      >
                        <option value="">Select a table...</option>
                        {tables.map((tableName) => (
                          <option key={tableName} value={tableName}>
                            {tableName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Operation
                      </label>
                      <div className="mt-1 flex space-x-2">
                        {(['create', 'read', 'update', 'delete'] as const).map((op) => (
                          <button
                            key={op}
                            onClick={() => handleOperationChange(op)}
                            className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium transition-all ${
                              operation === op 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {op.charAt(0).toUpperCase() + op.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {selectedTable && (
                    <div className="space-y-6">
                      {/* Create Form */}
                      {operation === 'create' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium text-gray-700 mb-3">
                            New Record Data
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tableColumns.map((column) => (
                              <div key={`form-${column}`}>
                                <label className="block text-sm font-medium text-gray-700">
                                  {column}
                                </label>
                                <input
                                  type="text"
                                  value={formData[column] || ''}
                                  onChange={(e) => handleFormChange(column, e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder={`Enter ${column}`}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={handleCrudOperation}
                              className="py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.01]"
                            >
                              Create Record
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Read Form */}
                      {operation === 'read' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium text-gray-700 mb-3">
                            Filter Records (Optional)
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tableColumns.map((column) => (
                              <div key={`where-${column}`}>
                                <label className="block text-sm font-medium text-gray-700">
                                  {column}
                                </label>
                                <input
                                  type="text"
                                  value={whereConditions[column] || ''}
                                  onChange={(e) => handleWhereChange(column, e.target.value)}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder={`Filter by ${column}`}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={handleCrudOperation}
                              className="py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.01]"
                            >
                              Search Records
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Update Table */}
                      {operation === 'update' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium text-gray-700 mb-3">
                            Select a Row to Update
                          </h3>
                          
                          {isEditing && selectedRow && editedRow ? (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-600">Editing Record</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(editedRow).map((field) => (
                                  <div key={`edit-${field}`}>
                                    <label className="block text-sm font-medium text-gray-700">
                                      {field}
                                    </label>
                                    <input
                                      type="text"
                                      value={editedRow[field] || ''}
                                      onChange={(e) => handleEditChange(field, e.target.value)}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      // Disable ID fields as they're typically primary keys
                                      disabled={field.toLowerCase().includes('id') || field === 'id' || field.endsWith('ID')}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end space-x-3 mt-4">
                                <button
                                  onClick={() => setIsEditing(false)}
                                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdateConfirm}
                                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Update Record
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    {tableRows.length > 0 && Object.keys(tableRows[0]).map((column, i) => (
                                      <th
                                        key={i}
                                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                                      >
                                        {column}
                                      </th>
                                    ))}
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-indigo-700">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {tableRows.map((row, rowIndex) => (
                                    <tr 
                                      key={rowIndex} 
                                      className="hover:bg-gray-50 transition-colors"
                                    >
                                      {Object.values(row).map((cell, cellIndex) => (
                                        <td
                                          key={cellIndex}
                                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                        >
                                          {cell != null ? cell.toString() : ''}
                                        </td>
                                      ))}
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                          onClick={() => handleRowSelect(row, rowIndex)}
                                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                        >
                                          Update
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Delete Table */}
                      {operation === 'delete' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium text-gray-700 mb-3">
                            Select Rows to Delete
                          </h3>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700">
                                    <input
                                      type="checkbox"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Select all rows
                                          const allIndexes = new Set(tableRows.map((_, i) => i));
                                          setSelectedRowsForDelete(allIndexes);
                                        } else {
                                          // Deselect all
                                          setSelectedRowsForDelete(new Set());
                                        }
                                      }}
                                      checked={selectedRowsForDelete.size === tableRows.length && tableRows.length > 0}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                  </th>
                                  {tableRows.length > 0 && Object.keys(tableRows[0]).map((column, i) => (
                                    <th
                                      key={i}
                                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {tableRows.map((row, rowIndex) => (
                                  <tr 
                                    key={rowIndex} 
                                    className={`hover:bg-gray-50 transition-colors ${
                                      selectedRowsForDelete.has(rowIndex) ? 'bg-red-50' : ''
                                    }`}
                                  >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        onChange={() => handleRowSelect(row, rowIndex)}
                                        checked={selectedRowsForDelete.has(rowIndex)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                      />
                                    </td>
                                    {Object.values(row).map((cell, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                      >
                                        {cell != null ? cell.toString() : ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {selectedRowsForDelete.size > 0 && (
                            <div className="flex justify-between items-center mt-4">
                              <p className="text-sm text-gray-700">
                                {selectedRowsForDelete.size} row(s) selected
                              </p>
                              <button
                                onClick={handleDeleteConfirm}
                                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Delete Selected
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* CRUD Results */}
              {crudResult && (
                <div className="mt-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Operation Results</h3>
                  
                  {crudResult.message && (
                    <div className="mb-4 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {crudResult.message}
                    </div>
                  )}
                  
                  {/* For Read operation */}
                  {operation === 'read' && crudResult.records && Array.isArray(crudResult.records) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {crudResult.records.length > 0 && Object.keys(crudResult.records[0]).map((column, i) => (
                              <th
                                key={i}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {crudResult.records.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                              {Object.values(row).map((cell: any, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                >
                                  {cell != null ? cell.toString() : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* For Create operation */}
                  {operation === 'create' && crudResult.record && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {crudResult.record.length > 0 && Object.keys(crudResult.record[0] || {}).map((column, i) => (
                              <th
                                key={i}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {crudResult.record.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                              {Object.values(row).map((cell: any, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                >
                                  {cell != null ? cell.toString() : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* For Delete operation */}
                  {operation === 'delete' && crudResult.deletedRecords && (
                    <div className="overflow-x-auto">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Deleted Records:</h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {crudResult.deletedRecords.length > 0 && Object.keys(crudResult.deletedRecords[0] || {}).map((column, i) => (
                              <th
                                key={i}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-indigo-700"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {crudResult.deletedRecords.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                              {Object.values(row).map((cell: any, cellIndex: number) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                                >
                                  {cell != null ? cell.toString() : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
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
