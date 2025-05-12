import random
import pymysql
from faker import Faker
from datetime import datetime, timedelta

fake = Faker()

def connect_to_db():
    return pymysql.connect(
        host='Tinatseis-MacBook-Air.local',
        user='root',
        password='shingi123',
        database='xyzcompany'
    )

def generate_person_data(num_records=100):
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Person Table")
    
    for _ in range(num_records):
        person_id = fake.unique.random_int(min=1, max=1000)
        last_name = fake.last_name()
        first_name = fake.first_name()
        age = random.randint(18, 64)
        gender = random.choice(['M', 'F'])
        address_line1 = fake.street_address()
        address_line2 = fake.secondary_address()
        city = fake.city()[:20]  # Truncate to 20 chars
        state = fake.state_abbr()
        zip_code = fake.zipcode()
        email = fake.email()

        sql = """
            INSERT INTO Person (PersonID, LastName, FirstName, Age, Gender, 
                              AddressLine1, AddressLine2, City, State, ZipCode, Email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (person_id, last_name, first_name, age, gender, 
                 address_line1, address_line2, city, state, zip_code, email)
        
        cursor.execute(sql, values)
    
    conn.commit()
    print("✅ Fake data inserted into Person table successfully!")
    cursor.close()
    conn.close()

def generate_phone_numbers():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO PhoneNumber Table")
    
    # Get all PersonIDs
    cursor.execute("SELECT PersonID FROM Person")
    person_ids = [row[0] for row in cursor.fetchall()]
    
    for person_id in person_ids:
        # Generate 1-2 phone numbers per person
        num_phones = random.randint(1, 2)
        for _ in range(num_phones):
            # Generate a 10-digit phone number
            area_code = random.randint(200, 999)
            prefix = random.randint(200, 999)
            line_number = random.randint(1000, 9999)
            phone_number = f"{area_code}-{prefix}-{line_number}"
            
            sql = "INSERT INTO PhoneNumber (PersonID, PhoneNumber) VALUES (%s, %s)"
            cursor.execute(sql, (person_id, phone_number))
    
    conn.commit()
    print("✅ Phone numbers inserted successfully!")
    cursor.close()
    conn.close()

def generate_person_types():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO PersonType Table")
    
    cursor.execute("SELECT PersonID FROM Person")
    person_ids = [row[0] for row in cursor.fetchall()]
    
    for person_id in person_ids:
        # Randomly assign 1-2 types per person
        types = random.sample(['Employee', 'Customer', 'PotentialEmployee'], 
                            random.randint(1, 2))
        for type_name in types:
            sql = "INSERT INTO PersonType (PersonID, Type) VALUES (%s, %s)"
            cursor.execute(sql, (person_id, type_name))
    
    conn.commit()
    print("✅ Person types inserted successfully!")
    cursor.close()
    conn.close()

def generate_customer_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Customer Table")
    
    # Get PersonIDs that are marked as Customer in PersonType
    cursor.execute("""
        SELECT p.PersonID 
        FROM Person p 
        JOIN PersonType pt ON p.PersonID = pt.PersonID 
        WHERE pt.Type = 'Customer'
    """)
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    for person_id in customer_ids:
        sql = "INSERT INTO Customer (PersonID) VALUES (%s)"
        cursor.execute(sql, (person_id,))
    
    conn.commit()
    print("✅ Customer data inserted successfully!")
    cursor.close()
    conn.close()

def generate_employee_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Employee Table")
    
    # Get PersonIDs that are marked as Employee in PersonType
    cursor.execute("""
        SELECT p.PersonID 
        FROM Person p 
        JOIN PersonType pt ON p.PersonID = pt.PersonID 
        WHERE pt.Type = 'Employee'
    """)
    employee_ids = [row[0] for row in cursor.fetchall()]
    
    # First, insert employees without supervisors
    for person_id in employee_ids:
        erank = random.choice(['Junior', 'Senior', 'Lead', 'Manager', 'Director'])
        title = fake.job()[:50]  # Truncate to 50 chars
        sql = "INSERT INTO Employee (PersonID, Erank, Title) VALUES (%s, %s, %s)"
        cursor.execute(sql, (person_id, erank, title))
    
    # Then, update some employees with supervisors
    cursor.execute("SELECT PersonID FROM Employee")
    all_employees = [row[0] for row in cursor.fetchall()]
    
    for employee_id in all_employees:
        if random.random() < 0.7:  # 70% chance of having a supervisor
            supervisor_id = random.choice([e for e in all_employees if e != employee_id])
            sql = "UPDATE Employee SET SupervisorID = %s WHERE PersonID = %s"
            cursor.execute(sql, (supervisor_id, employee_id))
    
    conn.commit()
    print("✅ Employee data inserted successfully!")
    cursor.close()
    conn.close()

def generate_department_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Department Table")
    
    departments = [
        (1, 'Marketing'),
        (2, 'Sales'),
        (3, 'Engineering'),
        (4, 'Human Resources'),
        (5, 'Finance'),
        (6, 'Operations'),
        (7, 'Research'),
        (8, 'Customer Service')
    ]
    
    for dept_id, dept_name in departments:
        sql = "INSERT INTO Department (Department_ID, DepartmentName) VALUES (%s, %s)"
        cursor.execute(sql, (dept_id, dept_name))
    
    conn.commit()
    print("✅ Department data inserted successfully!")
    cursor.close()
    conn.close()

def generate_job_positions():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO JobPosition Table")
    
    cursor.execute("SELECT Department_ID FROM Department")
    dept_ids = [row[0] for row in cursor.fetchall()]
    
    job_titles = [
        'Software Engineer', 'Data Analyst', 'Marketing Specialist',
        'Sales Representative', 'HR Manager', 'Financial Analyst',
        'Operations Manager', 'Research Scientist', 'Customer Support'
    ]
    
    for _ in range(50):  # Generate 50 job positions
        job_id = fake.unique.random_int(min=10000, max=99999)
        dept_id = random.choice(dept_ids)
        job_desc = random.choice(job_titles)
        posted_date = fake.date_between(start_date='-1y', end_date='today')
        
        sql = """
            INSERT INTO JobPosition (JobID, DepartmentID, JobDescription, PostedDate)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, (job_id, dept_id, job_desc, posted_date))
    
    conn.commit()
    print("✅ Job positions inserted successfully!")
    cursor.close()
    conn.close()

def generate_applications():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Application Table")
    
    # Get potential employees and job positions
    cursor.execute("""
        SELECT p.PersonID 
        FROM Person p 
        JOIN PersonType pt ON p.PersonID = pt.PersonID 
        WHERE pt.Type = 'PotentialEmployee'
    """)
    applicant_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT JobID FROM JobPosition")
    job_ids = [row[0] for row in cursor.fetchall()]
    
    for _ in range(100):  # Generate 100 applications
        application_id = fake.unique.random_int(min=1, max=1000)
        applicant_id = random.choice(applicant_ids)
        job_id = random.choice(job_ids)
        application_date = fake.date_between(start_date='-6m', end_date='today')
        status = random.choice(['Pending', 'Selected', 'Rejected'])
        
        sql = """
            INSERT INTO Application (ApplicationID, ApplicantID, JobID, ApplicationDate, Status)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (application_id, applicant_id, job_id, application_date, status))
    
    conn.commit()
    print("✅ Applications inserted successfully!")
    cursor.close()
    conn.close()

def generate_interviews():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Interview Table")
    
    # Get applications with 'Selected' status
    cursor.execute("""
        SELECT a.ApplicationID, a.ApplicantID, a.JobID
        FROM Application a
        WHERE a.Status = 'Selected'
    """)
    selected_applications = cursor.fetchall()
    
    for app_id, applicant_id, job_id in selected_applications:
        interview_id = fake.unique.random_int(min=1, max=1000)
        interview_time = fake.date_time_between(start_date='-3m', end_date='+3m')
        
        sql = """
            INSERT INTO Interview (InterviewID, JobID, CandidateID, InterviewTime)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, (interview_id, job_id, applicant_id, interview_time))
        
        # Generate interview grades
        num_rounds = random.randint(3, 7)
        for round_num in range(1, num_rounds + 1):
            grade = random.randint(60, 100)
            sql = """
                INSERT INTO InterviewGrade (InterviewID, InterviewerID, RoundNumber, Grade)
                VALUES (%s, %s, %s, %s)
            """
            # Randomly select an employee as interviewer
            cursor.execute("SELECT PersonID FROM Employee ORDER BY RAND() LIMIT 1")
            interviewer_id = cursor.fetchone()[0]
            cursor.execute(sql, (interview_id, interviewer_id, round_num, grade))
    
    conn.commit()
    print("✅ Interviews and grades inserted successfully!")
    cursor.close()
    conn.close()

def generate_products():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Product Table")
    
    product_types = ['Electronics', 'Furniture', 'Clothing', 'Food', 'Books']
    sizes = ['Small', 'Medium', 'Large', 'X-Large']
    styles = ['Modern', 'Classic', 'Casual', 'Formal', 'Sport']
    
    for _ in range(50):  # Generate 50 products
        product_id = fake.unique.random_int(min=1, max=1000)
        product_type = random.choice(product_types)
        size = random.choice(sizes)
        list_price = round(random.uniform(10.0, 1000.0), 2)
        weight = round(random.uniform(0.1, 50.0), 2)
        style = random.choice(styles)
        
        sql = """
            INSERT INTO Product (ProductID, ProductType, Size, ListPrice, Weight, Style)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (product_id, product_type, size, list_price, weight, style))
    
    conn.commit()
    print("✅ Products inserted successfully!")
    cursor.close()
    conn.close()

def generate_sales():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Sale Table")
    
    # Get salespeople and customers
    cursor.execute("""
        SELECT e.PersonID 
        FROM Employee e 
        JOIN PersonType pt ON e.PersonID = pt.PersonID 
        WHERE pt.Type = 'Employee'
    """)
    salesperson_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT p.PersonID 
        FROM Person p 
        JOIN PersonType pt ON p.PersonID = pt.PersonID 
        WHERE pt.Type = 'Customer'
    """)
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT ProductID FROM Product")
    product_ids = [row[0] for row in cursor.fetchall()]
    
    # Create some sales sites
    sites = [(1, 'Main Store', 'New York'),
             (2, 'Online Store', 'Virtual'),
             (3, 'Outlet Store', 'Los Angeles')]
    
    for site_id, site_name, location in sites:
        sql = "INSERT INTO Site (SiteID, SiteName, Location) VALUES (%s, %s, %s)"
        cursor.execute(sql, (site_id, site_name, location))
    
    # Generate sales records
    for _ in range(200):  # Generate 200 sales
        sales_id = fake.unique.random_int(min=1, max=1000)
        salesperson_id = random.choice(salesperson_ids)
        customer_id = random.choice(customer_ids)
        product_id = random.choice(product_ids)
        site_id = random.randint(1, 3)
        sales_time = fake.date_time_between(start_date='-1y', end_date='now')
        amount = round(random.uniform(10.0, 1000.0), 2)
        
        sql = """
            INSERT INTO Sale (SalesID, SalesPersonID, CustomerID, ProductID, SiteID, SalesTime, Amount)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (sales_id, salesperson_id, customer_id, product_id, 
                           site_id, sales_time, amount))
    
    conn.commit()
    print("✅ Sales data inserted successfully!")
    cursor.close()
    conn.close()

def generate_salaries():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("-- INSERT INTO Salary Table")
    
    cursor.execute("SELECT PersonID FROM Employee")
    employee_ids = [row[0] for row in cursor.fetchall()]
    
    for employee_id in employee_ids:
        # Generate 12 months of salary records
        for month in range(1, 13):
            transaction_number = fake.unique.random_int(min=1, max=10000)
            pay_date = datetime(2024, month, 15)
            amount = random.randint(3000, 15000)
            
            sql = """
                INSERT INTO Salary (EmployeeID, TransactionNumber, PayDate, Amount)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (employee_id, transaction_number, pay_date, amount))
    
    conn.commit()
    print("✅ Salary data inserted successfully!")
    cursor.close()
    conn.close()

def clear_existing_data():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    print("Clearing existing data...")
    
    # Delete in reverse order of dependencies to avoid foreign key constraint issues
    tables = [
        'Salary', 'Sale', 'Product', 'Site', 'InterviewGrade', 'Interview', 
        'Application', 'JobPosition', 'Department', 'Employee', 
        'Customer', 'PersonType', 'PhoneNumber', 'Person'
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

def main():
    print("Starting data generation...")
    
    # Clear existing data first
    clear_existing_data()
    
    # Generate data in the correct order to maintain referential integrity
    generate_person_data()
    generate_phone_numbers()
    generate_person_types()
    generate_customer_data()
    generate_employee_data()
    generate_department_data()
    generate_job_positions()
    generate_applications()
    generate_interviews()
    generate_products()
    generate_sales()
    generate_salaries()
    
    print("✅ All data generated successfully!")

if __name__ == "__main__":
    main() 