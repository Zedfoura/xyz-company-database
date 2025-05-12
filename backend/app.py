from flask import Flask, render_template, request, session, redirect, url_for
import mysql.connector
import logging

# Initialize Flask app
app = Flask(__name__)
app.secret_key = "xyz_company_secret_key"  # Replace with a strong secret key

# Configure logging
logging.basicConfig(level=logging.DEBUG)

def log_query(query, results):
    """Helper function to log queries and results for debugging."""
    logging.debug(f"Executed Query: {query}")
    logging.debug(f"Results: {results}")

# Predefined queries based on requirements
predefined_queries = {
    "Interviewers for Hellen Cole (Job 11111)": """
        SELECT DISTINCT i.InterviewerID, p.LastName, p.FirstName 
        FROM InterviewerAssignment i 
        JOIN Interview iv ON i.InterviewID = iv.InterviewID 
        JOIN JobPosition jp ON iv.JobID = jp.JobID 
        JOIN Person p ON i.InterviewerID = p.PersonID 
        WHERE iv.CandidateID = (SELECT PersonID FROM Person WHERE FirstName = 'Hellen' AND LastName = 'Cole') 
        AND jp.JobID = 11111;
    """,
    "Jobs posted by Marketing (January 2011)": """
        SELECT j.JobID 
        FROM JobPosition j 
        JOIN Department d ON j.DepartmentID = d.Department_ID 
        WHERE d.DepartmentName = 'Marketing' 
        AND j.PostedDate >= '2011-01-01' 
        AND j.PostedDate < '2011-02-01';
    """,
    "Employees with no supervisees": """
        SELECT e.PersonID, CONCAT(p.FirstName, ' ', p.LastName) AS Name 
        FROM Employee e 
        JOIN Person p ON e.PersonID = p.PersonID 
        WHERE e.PersonID NOT IN (
            SELECT SupervisorID 
            FROM Employee 
            WHERE SupervisorID IS NOT NULL
        );
    """,
    "Marketing sites with no sales (March 2011)": """
        SELECT s.SiteID, s.Location 
        FROM Site s 
        JOIN Department d ON d.DepartmentName = 'Marketing' 
        WHERE s.SiteID NOT IN (
            SELECT SiteID 
            FROM Sale 
            WHERE SalesTime BETWEEN '2011-03-01' AND '2011-03-31'
        );
    """,
    "Jobs with no hires after 1 month of posting": """
        SELECT jp.JobID, jp.JobDescription 
        FROM JobPosition jp 
        WHERE NOT EXISTS (
            SELECT 1 
            FROM Application a 
            WHERE a.JobID = jp.JobID 
            AND a.ApplicationDate <= DATE_ADD(jp.PostedDate, INTERVAL 1 MONTH)
            AND a.Status = 'Selected'
        );
    """,
    "Salespeople who sold all products > $200": """
        SELECT sp.PersonID, CONCAT(p.FirstName, ' ', p.LastName) AS Name 
        FROM Employee sp 
        JOIN Person p ON sp.PersonID = p.PersonID 
        WHERE NOT EXISTS (
            SELECT pt.ProductType 
            FROM Product pt 
            WHERE pt.ListPrice > 200 
            AND pt.ProductType NOT IN (
                SELECT DISTINCT pr.ProductType 
                FROM Sale s 
                JOIN Product pr ON s.ProductID = pr.ProductID 
                WHERE s.SalesPersonID = sp.PersonID
            )
        );
    """,
    "Departments with no job posts (Jan-Feb 2011)": """
        SELECT d.Department_ID, d.DepartmentName 
        FROM Department d 
        WHERE d.Department_ID NOT IN (
            SELECT jp.DepartmentID 
            FROM JobPosition jp 
            WHERE jp.PostedDate BETWEEN '2011-01-01' AND '2011-02-28'
        );
    """,
    "Employees applying for job 12345": """
        SELECT e.PersonID AS EmployeeID, CONCAT(p.FirstName, ' ', p.LastName) AS Name, ed.DepartmentID 
        FROM Employee e 
        JOIN Person p ON e.PersonID = p.PersonID 
        JOIN Application a ON e.PersonID = a.ApplicantID 
        JOIN JobPosition jp ON a.JobID = jp.JobID 
        LEFT JOIN EmployeeDepartmentAssignment ed ON e.PersonID = ed.EmployeeID 
        WHERE jp.JobID = 12345;
    """,
    "Best seller's type": """
        SELECT pt.Type AS EmployeeType, COUNT(*) AS TotalSales 
        FROM Sale s 
        JOIN Employee e ON s.SalesPersonID = e.PersonID 
        JOIN PersonType pt ON e.PersonID = pt.PersonID 
        WHERE pt.Type = 'Employee' 
        GROUP BY pt.Type 
        ORDER BY TotalSales DESC 
        LIMIT 1;
    """,
    "Product type with highest net profit": """
        SELECT pr.ProductType 
        FROM Product pr 
        JOIN ProductPart pp ON pr.ProductID = pp.ProductID 
        JOIN VendorPart vp ON pp.PartID = vp.PartID 
        GROUP BY pr.ProductType 
        ORDER BY (SUM(pr.ListPrice) - SUM(vp.Price)) DESC 
        LIMIT 1;
    """,
    "Employees working in all departments": """
        SELECT e.EmployeeID AS PersonID, p.LastName, p.FirstName 
        FROM EmployeeDepartmentAssignment e 
        JOIN Person p ON e.EmployeeID = p.PersonID 
        GROUP BY e.EmployeeID, p.LastName, p.FirstName 
        HAVING COUNT(DISTINCT e.DepartmentID) = (SELECT COUNT(*) FROM Department);
    """,
    "Interviewees selected (name and email)": """
        SELECT CONCAT(p.FirstName, ' ', p.LastName) AS IntervieweeName, p.Email AS EmailAddress 
        FROM Interview i 
        JOIN Person p ON i.CandidateID = p.PersonID 
        WHERE EXISTS (
            SELECT 1 
            FROM InterviewGrade ig 
            WHERE ig.InterviewID = i.InterviewID 
            AND ig.Grade >= 70
            GROUP BY ig.InterviewID
            HAVING COUNT(DISTINCT ig.RoundNumber) >= 5
        );
    """,
    "Interviewees (name, phone, email)": """
        SELECT p.FirstName, p.LastName, ph.PhoneNumber, p.Email
        FROM Person p 
        JOIN PhoneNumber ph ON p.PersonID = ph.PersonID 
        JOIN Interview i ON p.PersonID = i.CandidateID
        WHERE EXISTS (
            SELECT 1 
            FROM InterviewGrade ig 
            WHERE ig.InterviewID = i.InterviewID 
            AND ig.Grade >= 70
            GROUP BY ig.InterviewID
            HAVING COUNT(DISTINCT ig.RoundNumber) >= 5
        );
    """,
    "Employee with highest average salary": """
        SELECT p.PersonID, p.FirstName, p.LastName 
        FROM Person p 
        JOIN Salary s ON p.PersonID = s.EmployeeID 
        GROUP BY s.EmployeeID 
        ORDER BY AVG(s.Amount) DESC 
        LIMIT 1;
    """,
    "Vendor supplying 'Cup' (lowest price)": """
        SELECT v.VendorID, v.Name AS VendorName 
        FROM Vendor v 
        JOIN VendorPart vp ON v.VendorID = vp.VendorID 
        JOIN Part p ON vp.PartID = p.PartID 
        WHERE p.PartName = 'Cup' 
        AND p.Weight < 4 
        AND vp.Price = (
            SELECT MIN(vp2.Price) 
            FROM VendorPart vp2 
            JOIN Part p2 ON vp2.PartID = p2.PartID 
            WHERE p2.PartName = 'Cup' 
            AND p2.Weight < 4
        );
    """,
    "View: Employee Average Monthly Salaries": """
        SELECT * FROM EmployeeAverageSalary
        ORDER BY AverageMonthlySalary DESC;
    """,
    "View: Interview Rounds Passed": """
        SELECT * FROM InterviewRoundsPassed
        WHERE PassedRounds >= 5
        ORDER BY PassedRounds DESC;
    """,
    "View: Product Type Sales": """
        SELECT * FROM ProductTypeSales
        ORDER BY TotalItemsSold DESC;
    """,
    "View: Product Part Costs": """
        SELECT * FROM ProductPartCost
        ORDER BY TotalPartCost DESC;
    """
}

@app.route("/", methods=["GET", "POST"])
def index():
    data = []  # Stores query results
    error_message = None
    success_message = None
    selected_query = None

    if request.method == "POST":
        action = request.form["action"]

        if action == "connect":
            # Store connection details in the session
            session["host"] = request.form["host"]
            session["port"] = request.form["port"]
            session["user"] = request.form["user"]
            session["password"] = request.form["password"]
            session["database"] = request.form["database"]
            success_message = "Connected to the database."

        elif action == "disconnect":
            session.clear()
            success_message = "Disconnected from the database."

        elif action == "show_tables":
            try:
                connection = get_connection()
                cursor = connection.cursor()
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 5")
                    rows = cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description]
                    data.append({"table_name": table_name, "columns": columns, "rows": rows})
                cursor.close()
                success_message = "Tables and data fetched successfully."
            except mysql.connector.Error as err:
                error_message = f"Error: {err}"
            finally:
                if "connection" in locals() and connection.is_connected():
                    connection.close()

        elif action == "execute_query":
            selected_query = request.form.get("query")
            try:
                connection = get_connection()
                cursor = connection.cursor()
                query = predefined_queries[selected_query]
                cursor.execute(query)
                query_results = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                log_query(query, query_results)
                data = [{"columns": columns, "rows": query_results}]
                cursor.close()
                success_message = "Query executed successfully."
            except mysql.connector.Error as err:
                error_message = f"Error executing query: {err}"
            finally:
                if "connection" in locals() and connection.is_connected():
                    connection.close()

    return render_template(
        "index.html",
        data=data,
        predefined_queries=predefined_queries,
        selected_query=selected_query,
        error_message=error_message,
        success_message=success_message,
        connected=("host" in session),
    )

def get_connection():
    """Helper function to establish a connection using session data."""
    if "host" in session:
        return mysql.connector.connect(
            host=session["host"],
            port=int(session["port"]),
            user=session["user"],
            password=session["password"],
            database=session["database"]
        )
    else:
        raise mysql.connector.Error("Database connection not initialized.")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True) 