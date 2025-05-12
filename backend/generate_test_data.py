import pymysql
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_db():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'xyzcompany')
    )

def clear_existing_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies to avoid foreign key constraint issues
    tables = [
        'Salary', 'Sale', 'ProductPart', 'VendorPart', 'Part', 'Product', 
        'EmployeeSiteAssignment', 'Site', 'Vendor', 'InterviewGrade', 
        'InterviewerAssignment', 'Interview', 'Application', 'JobPosition', 
        'EmployeeDepartmentAssignment', 'Department', 'PreferredSalesperson', 
        'Customer', 'Employee', 'PersonType', 'PhoneNumber', 'Person'
    ]
    
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"Cleared {table} table")
        except Exception as e:
            print(f"Error clearing {table}: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ All existing data cleared!")

def generate_specific_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    # Create people
    print("Generating specific person data...")
    people = [
        (1, "Smith", "John", 35, "M", "123 Main St", "Apt 4B", "New York", "NY", "10001", "john.smith@example.com"),
        (2, "Johnson", "Mary", 42, "F", "456 Oak Ave", "", "Los Angeles", "CA", "90001", "mary.j@example.com"),
        (3, "Cole", "Hellen", 28, "F", "789 Pine St", "Suite 3", "Chicago", "IL", "60007", "hellen.cole@example.com"),
        (4, "Brown", "James", 45, "M", "321 Cedar Rd", "", "Dallas", "TX", "75001", "james.b@example.com"),
        (5, "Davis", "Sarah", 31, "F", "654 Maple Dr", "Unit 7", "Miami", "FL", "33101", "sarah.d@example.com"),
        (6, "Wilson", "Michael", 39, "M", "987 Elm St", "", "Boston", "MA", "02101", "michael.w@example.com"),
        (7, "Moore", "Jennifer", 36, "F", "147 Birch Ave", "Apt 12", "Seattle", "WA", "98101", "jennifer.m@example.com"),
        (8, "Taylor", "Robert", 52, "M", "258 Pine Ln", "", "Denver", "CO", "80201", "robert.t@example.com"),
        (9, "Anderson", "Lisa", 33, "F", "369 Oak Blvd", "Suite 5", "Phoenix", "AZ", "85001", "lisa.a@example.com"),
        (10, "Thomas", "William", 47, "M", "741 Maple Ct", "", "Philadelphia", "PA", "19101", "william.t@example.com"),
        (11, "Jackson", "Emma", 29, "F", "852 Cedar St", "Unit 3B", "San Francisco", "CA", "94101", "emma.j@example.com"),
        (12, "White", "David", 41, "M", "963 Elm Ave", "", "Atlanta", "GA", "30301", "david.w@example.com"),
        (13, "Harris", "Olivia", 27, "F", "159 Pine Dr", "Apt 8", "Houston", "TX", "77001", "olivia.h@example.com"),
        (14, "Martin", "James", 38, "M", "753 Oak Rd", "", "Detroit", "MI", "48201", "james.m@example.com"),
        (15, "Thompson", "Sophia", 34, "F", "951 Maple Ln", "Suite 2", "Portland", "OR", "97201", "sophia.t@example.com")
    ]
    
    for person in people:
        sql = """
            INSERT INTO Person 
            (PersonID, LastName, FirstName, Age, Gender, AddressLine1, AddressLine2, City, State, ZipCode, Email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, person)
    
    # Create phone numbers
    print("Generating phone numbers...")
    phone_numbers = [
        (1, "555-123-4567"),
        (2, "555-234-5678"),
        (3, "555-345-6789"),
        (4, "555-456-7890"),
        (5, "555-567-8901"),
        (6, "555-678-9012"),
        (7, "555-789-0123"),
        (8, "555-890-1234"),
        (9, "555-901-2345"),
        (10, "555-012-3456"),
        (11, "555-123-7890"),
        (12, "555-234-8901"),
        (13, "555-345-9012"),
        (14, "555-456-0123"),
        (15, "555-567-1234")
    ]
    
    for phone in phone_numbers:
        sql = "INSERT INTO PhoneNumber (PersonID, PhoneNumber) VALUES (%s, %s)"
        cursor.execute(sql, phone)
    
    # Assign person types
    print("Assigning person types...")
    person_types = [
        (1, "Employee"),  # John Smith - Employee
        (2, "Employee"),  # Mary Johnson - Employee
        (3, "PotentialEmployee"),  # Hellen Cole - PotentialEmployee
        (4, "Employee"),  # James Brown - Employee
        (5, "Customer"),  # Sarah Davis - Customer
        (6, "Customer"),  # Michael Wilson - Customer
        (7, "Employee"),  # Jennifer Moore - Employee
        (8, "Customer"),  # Robert Taylor - Customer
        (9, "Employee"),  # Lisa Anderson - Employee
        (10, "Customer"),  # William Thomas - Customer
        (11, "Employee"),  # Emma Jackson - Employee
        (12, "Customer"),  # David White - Customer
        (13, "PotentialEmployee"),  # Olivia Harris - PotentialEmployee
        (14, "Employee"),  # James Martin - Employee
        (15, "Customer")   # Sophia Thompson - Customer
    ]
    
    for person_type in person_types:
        sql = "INSERT INTO PersonType (PersonID, Type) VALUES (%s, %s)"
        cursor.execute(sql, person_type)
    
    # Create customers
    print("Creating customer records...")
    customers = [5, 6, 8, 10, 12, 15]  # Customer PersonIDs
    
    for customer_id in customers:
        sql = "INSERT INTO Customer (PersonID) VALUES (%s)"
        cursor.execute(sql, (customer_id,))
    
    # Create employees
    print("Creating employee records...")
    employees = [
        (1, "Senior", "Sales Manager", None),  # John Smith - no supervisor
        (2, "Senior", "Marketing Director", 1),  # Mary Johnson - supervised by John
        (4, "Junior", "Sales Representative", 1),  # James Brown - supervised by John
        (7, "Senior", "HR Manager", None),  # Jennifer Moore - no supervisor
        (9, "Junior", "Marketing Specialist", 2),  # Lisa Anderson - supervised by Mary
        (11, "Junior", "Sales Representative", 1),  # Emma Jackson - supervised by John
        (14, "Senior", "Finance Manager", None)  # James Martin - no supervisor
    ]
    
    for employee in employees:
        sql = "INSERT INTO Employee (PersonID, Erank, Title, SupervisorID) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, employee)
    
    # Create departments
    print("Creating departments...")
    departments = [
        (1, "Sales"),
        (2, "Marketing"),
        (3, "Human Resources"),
        (4, "Finance"),
        (5, "Engineering")
    ]
    
    for dept in departments:
        sql = "INSERT INTO Department (Department_ID, DepartmentName) VALUES (%s, %s)"
        cursor.execute(sql, dept)
    
    # Assign employees to departments
    print("Assigning employees to departments...")
    employee_departments = [
        (1, 1, "2023-01-01 09:00:00", None),  # John Smith - Sales
        (2, 2, "2023-01-01 09:00:00", None),  # Mary Johnson - Marketing
        (4, 1, "2023-01-15 09:00:00", None),  # James Brown - Sales
        (7, 3, "2023-01-15 09:00:00", None),  # Jennifer Moore - HR
        (9, 2, "2023-02-01 09:00:00", None),  # Lisa Anderson - Marketing
        (11, 1, "2023-02-15 09:00:00", None),  # Emma Jackson - Sales
        (14, 4, "2023-02-15 09:00:00", None),  # James Martin - Finance
        # Add employee to multiple departments for "Employees working in all departments" query
        (1, 2, "2023-03-01 09:00:00", None),  # John Smith - also in Marketing
        (1, 3, "2023-03-15 09:00:00", None),  # John Smith - also in HR
        (1, 4, "2023-04-01 09:00:00", None),  # John Smith - also in Finance
        (1, 5, "2023-04-15 09:00:00", None)   # John Smith - also in Engineering
    ]
    
    for emp_dept in employee_departments:
        sql = """
            INSERT INTO EmployeeDepartmentAssignment 
            (EmployeeID, DepartmentID, StartTime, EndTime) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, emp_dept)
    
    # Create job positions
    print("Creating job positions...")
    job_positions = [
        (11111, 1, "Senior Sales Executive", "2011-01-05"),  # Job for Hellen Cole
        (22222, 2, "Marketing Specialist", "2011-01-10"),  # Marketing job January 2011
        (33333, 3, "HR Assistant", "2011-03-15"),
        (44444, 4, "Financial Analyst", "2011-02-20"),
        (12345, 5, "Software Engineer", "2023-06-15")  # Job 12345 for the query
    ]
    
    for job in job_positions:
        sql = """
            INSERT INTO JobPosition 
            (JobID, DepartmentID, JobDescription, PostedDate) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, job)
    
    # Create applications
    print("Creating job applications...")
    applications = [
        (1001, 3, 11111, "2011-01-10", "Selected"),  # Hellen Cole applied for Sales job
        (1002, 13, 12345, "2023-06-20", "Pending"),  # Olivia Harris applied for Software Engineer
        (1003, 1, 12345, "2023-06-22", "Pending"),   # John Smith (employee) applied for Software Engineer
        (1004, 4, 12345, "2023-06-25", "Pending")    # James Brown (employee) applied for Software Engineer
    ]
    
    for app in applications:
        sql = """
            INSERT INTO Application 
            (ApplicationID, ApplicantID, JobID, ApplicationDate, Status) 
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, app)
    
    # Create interviews
    print("Creating interviews...")
    interviews = [
        (101, 11111, 3, "2011-01-15 13:00:00")  # Hellen Cole interview for 11111
    ]
    
    for interview in interviews:
        sql = """
            INSERT INTO Interview 
            (InterviewID, JobID, CandidateID, InterviewTime) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, interview)
    
    # Assign interviewers
    print("Assigning interviewers...")
    interviewers = [
        (101, 1),  # John Smith interviewing Hellen Cole
        (101, 4)   # James Brown interviewing Hellen Cole
    ]
    
    for interviewer in interviewers:
        sql = """
            INSERT INTO InterviewerAssignment 
            (InterviewID, InterviewerID) 
            VALUES (%s, %s)
        """
        cursor.execute(sql, interviewer)
    
    # Add interview grades
    print("Adding interview grades...")
    interview_grades = [
        (101, 1, 1, 85),  # Round 1 by John Smith
        (101, 1, 2, 90),  # Round 2 by John Smith
        (101, 1, 3, 88),  # Round 3 by John Smith
        (101, 1, 4, 92),  # Round 4 by John Smith
        (101, 1, 5, 89),  # Round 5 by John Smith
        (101, 4, 1, 80),  # Round 1 by James Brown
        (101, 4, 2, 85),  # Round 2 by James Brown
        (101, 4, 3, 82),  # Round 3 by James Brown
        (101, 4, 4, 88),  # Round 4 by James Brown
        (101, 4, 5, 86)   # Round 5 by James Brown
    ]
    
    for grade in interview_grades:
        sql = """
            INSERT INTO InterviewGrade 
            (InterviewID, InterviewerID, RoundNumber, Grade) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, grade)
    
    # Create products
    print("Creating products...")
    products = [
        (101, "Electronics", "Medium", 250.00, 2.5, "Modern"),
        (102, "Furniture", "Large", 500.00, 15.0, "Classic"),
        (103, "Clothing", "Small", 50.00, 0.5, "Casual"),
        (104, "Electronics", "Small", 150.00, 1.0, "Modern"),
        (105, "Cup", "Small", 15.00, 0.3, "Modern"),  # Cup for the query
        (106, "Cup", "Medium", 20.00, 0.5, "Classic")  # Another Cup for the query
    ]
    
    for product in products:
        sql = """
            INSERT INTO Product 
            (ProductID, ProductType, Size, ListPrice, Weight, Style) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, product)
    
    # Create sites
    print("Creating sites...")
    sites = [
        (1, "Main Store", "New York"),
        (2, "Online Store", "Virtual"),
        (3, "Outlet Store", "Los Angeles")
    ]
    
    for site in sites:
        sql = "INSERT INTO Site (SiteID, SiteName, Location) VALUES (%s, %s, %s)"
        cursor.execute(sql, site)
    
    # Create site assignments for employees
    print("Assigning employees to sites...")
    employee_sites = [
        (1, 1, "2023-01-01", None),  # John Smith at Main Store
        (4, 1, "2023-01-15", None),  # James Brown at Main Store
        (11, 3, "2023-02-15", None)  # Emma Jackson at Outlet Store
    ]
    
    for emp_site in employee_sites:
        sql = """
            INSERT INTO EmployeeSiteAssignment 
            (EmployeeID, SiteID, StartDate, EndDate) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, emp_site)
    
    # Create sales
    print("Creating sales...")
    sales = [
        (501, 1, 5, 101, 1, "2023-05-01 14:30:00", 250.00),  # John sold Electronics to Sarah
        (502, 4, 6, 102, 1, "2023-05-05 10:15:00", 500.00),  # James sold Furniture to Michael
        (503, 11, 8, 103, 3, "2023-05-10 16:45:00", 50.00),  # Emma sold Clothing to Robert
        (504, 1, 10, 104, 1, "2023-05-15 13:20:00", 150.00),  # John sold Electronics to William
        (505, 4, 12, 105, 1, "2023-05-20 11:10:00", 15.00),  # James sold Cup to David
        (506, 11, 15, 106, 3, "2023-05-25 15:30:00", 20.00)   # Emma sold Cup to Sophia
    ]
    
    for sale in sales:
        sql = """
            INSERT INTO Sale 
            (SalesID, SalesPersonID, CustomerID, ProductID, SiteID, SalesTime, Amount) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, sale)
    
    # Create vendors
    print("Creating vendors...")
    vendors = [
        (201, "ElectroSupply", "111 Tech St", "", "San Jose", "CA", "95101", "ES-12345", 8, "https://electrosupply.com"),
        (202, "FurnitureCo", "222 Wood Ave", "Suite 10", "Grand Rapids", "MI", "49501", "FC-67890", 7, "https://furnitureco.com"),
        (203, "FabricWorld", "333 Textile Rd", "", "Charlotte", "NC", "28201", "FW-13579", 9, "https://fabricworld.com"),
        (204, "CupMaker", "444 Ceramic Dr", "Building A", "Columbus", "OH", "43201", "CM-24680", 6, "https://cupmaker.com"),
        (205, "CupCraft", "555 Pottery Ln", "", "Boulder", "CO", "80301", "CC-97531", 8, "https://cupcraft.com")
    ]
    
    for vendor in vendors:
        sql = """
            INSERT INTO Vendor 
            (VendorID, Name, AddressLine1, AddressLine2, City, State, ZipCode, AccountNumber, CreditRating, PurchasingWebServiceURL) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, vendor)
    
    # Create parts
    print("Creating parts...")
    parts = [
        (301, 101, 5),  # Part for Electronics
        (302, 102, 3),  # Part for Furniture
        (303, 103, 10), # Part for Clothing
        (304, 104, 8),  # Part for Electronics
        (305, 105, 20), # Part for Cup
        (306, 106, 15)  # Part for Cup
    ]
    
    for part in parts:
        sql = "INSERT INTO Part (PartID, ProductID, Quantity) VALUES (%s, %s, %s)"
        cursor.execute(sql, part)
    
    # Create vendor parts
    print("Creating vendor parts pricing...")
    vendor_parts = [
        (201, 301, 50.00),  # ElectroSupply provides part 301
        (202, 302, 100.00), # FurnitureCo provides part 302
        (203, 303, 5.00),   # FabricWorld provides part 303
        (204, 305, 3.50),   # CupMaker provides part 305 at $3.50
        (205, 305, 3.00),   # CupCraft provides part 305 at $3.00 (lowest)
        (204, 306, 4.00),   # CupMaker provides part 306
        (205, 306, 4.50)    # CupCraft provides part 306
    ]
    
    for vendor_part in vendor_parts:
        sql = "INSERT INTO VendorPart (VendorID, PartID, Price) VALUES (%s, %s, %s)"
        cursor.execute(sql, vendor_part)
    
    # Create product parts
    print("Creating product parts...")
    product_parts = [
        (101, 301, 1),  # Electronics uses part 301
        (102, 302, 1),  # Furniture uses part 302
        (103, 303, 1),  # Clothing uses part 303
        (104, 304, 1),  # Electronics uses part 304
        (105, 305, 1),  # Cup uses part 305
        (106, 306, 1)   # Cup uses part 306
    ]
    
    for product_part in product_parts:
        sql = "INSERT INTO ProductPart (ProductID, PartID, Quantity) VALUES (%s, %s, %s)"
        cursor.execute(sql, product_part)
    
    # Create salaries
    print("Creating salary records...")
    salaries = [
        (1, 10001, "2023-01-15", 8000),   # John Smith - January
        (1, 10002, "2023-02-15", 8000),   # John Smith - February
        (1, 10003, "2023-03-15", 8000),   # John Smith - March
        (2, 10004, "2023-01-15", 7500),   # Mary Johnson - January
        (2, 10005, "2023-02-15", 7500),   # Mary Johnson - February
        (2, 10006, "2023-03-15", 7500),   # Mary Johnson - March
        (4, 10007, "2023-01-15", 5000),   # James Brown - January
        (4, 10008, "2023-02-15", 5000),   # James Brown - February
        (4, 10009, "2023-03-15", 5000),   # James Brown - March
        (7, 10010, "2023-01-15", 7000),   # Jennifer Moore - January
        (7, 10011, "2023-02-15", 7000),   # Jennifer Moore - February
        (7, 10012, "2023-03-15", 7000),   # Jennifer Moore - March
        (9, 10013, "2023-02-15", 5500),   # Lisa Anderson - February
        (9, 10014, "2023-03-15", 5500),   # Lisa Anderson - March
        (11, 10015, "2023-02-15", 4800),  # Emma Jackson - February
        (11, 10016, "2023-03-15", 4800),  # Emma Jackson - March
        (14, 10017, "2023-02-15", 7200),  # James Martin - February
        (14, 10018, "2023-03-15", 7200)   # James Martin - March
    ]
    
    for salary in salaries:
        sql = """
            INSERT INTO Salary 
            (EmployeeID, TransactionNumber, PayDate, Amount) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, salary)
    
    conn.commit()
    print("✅ All specific test data generated successfully!")
    cursor.close()
    conn.close()

def main():
    print("Starting test data generation...")
    
    # Clear existing data first
    clear_existing_data()
    
    # Generate specific data for the queries
    generate_specific_data()
    
    print("✅ Test data generation completed successfully!")

if __name__ == "__main__":
    main() 