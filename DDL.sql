drop database xyzcompany;
create database xyzcompany;
create user 'xyzcompany'@'localhost' identified by 'admin';
grant all on xyzcompany.* to 'admin'@'localhost';
flush privileges;
show databases; -- company must be visible

use xyzcompany;

-- Table: Person
CREATE TABLE Person (
    PersonID INT PRIMARY KEY,
    LastName VARCHAR(20) NOT NULL,
    FirstName VARCHAR(20) NOT NULL,
    Age INT CHECK (Age < 65),
    Gender CHAR(1) CHECK (Gender IN ('M', 'F')),
    AddressLine1 VARCHAR(50),
    AddressLine2 VARCHAR(50),
    City VARCHAR(20),
    State VARCHAR(13),
    ZipCode INT,
    Email VARCHAR(100)
);

-- Table: PhoneNumber
CREATE TABLE PhoneNumber (
    PersonID INT,
    PhoneNumber VARCHAR(15),
    PRIMARY KEY (PersonID, PhoneNumber),
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE
);

-- Table: PersonType
CREATE TABLE PersonType (
    PersonID INT,
    Type VARCHAR(20) NOT NULL,
    PRIMARY KEY (PersonID, Type),
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    CHECK (Type IN ('Employee', 'Customer', 'PotentialEmployee'))
);

-- Table: Employee
CREATE TABLE Employee (
    PersonID INT PRIMARY KEY,
    Erank VARCHAR(50),
    Title VARCHAR(50),
    SupervisorID INT,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE,
    FOREIGN KEY (SupervisorID) REFERENCES Employee(PersonID) ON DELETE SET NULL
);

-- Table: Customer
CREATE TABLE Customer (
    PersonID INT PRIMARY KEY,
    FOREIGN KEY (PersonID) REFERENCES Person(PersonID) ON DELETE CASCADE
);

-- Table: PreferredSalesperson
CREATE TABLE PreferredSalesperson (
    CustomerID INT,
    SalesPersonID INT,
    PRIMARY KEY (CustomerID, SalesPersonID),
    FOREIGN KEY (CustomerID) REFERENCES Customer(PersonID) ON DELETE CASCADE,
    FOREIGN KEY (SalesPersonID) REFERENCES Employee(PersonID)
);

-- Table: Department
CREATE TABLE Department (
    Department_ID INT PRIMARY KEY,
    DepartmentName VARCHAR(50) NOT NULL
);

-- Table: EmployeeDepartmentAssignment
CREATE TABLE EmployeeDepartmentAssignment (
    EmployeeID INT,
    DepartmentID INT,
    StartTime TIMESTAMP,
    EndTime TIMESTAMP,
    PRIMARY KEY (EmployeeID, DepartmentID, StartTime),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(PersonID),
    FOREIGN KEY (DepartmentID) REFERENCES Department(Department_ID)
);

-- Table: JobPosition
CREATE TABLE JobPosition (
    JobID INT PRIMARY KEY,
    DepartmentID INT,
    JobDescription VARCHAR(50),
    PostedDate DATE,
    FOREIGN KEY (DepartmentID) REFERENCES Department(Department_ID)
);

-- Table: Application
CREATE TABLE Application (
    ApplicationID INT PRIMARY KEY,
    ApplicantID INT,
    JobID INT,
    ApplicationDate DATE,
    Status VARCHAR(20) CHECK (Status IN ('Pending', 'Selected', 'Rejected')),
    FOREIGN KEY (ApplicantID) REFERENCES Person(PersonID),
    FOREIGN KEY (JobID) REFERENCES JobPosition(JobID)
);

-- Table: Interview
CREATE TABLE Interview (
    InterviewID INT PRIMARY KEY,
    JobID INT,
    CandidateID INT,
    InterviewTime TIMESTAMP,
    FOREIGN KEY (JobID) REFERENCES JobPosition(JobID),
    FOREIGN KEY (CandidateID) REFERENCES Person(PersonID)
);

-- Table: InterviewerAssignment
CREATE TABLE InterviewerAssignment (
    InterviewID INT,
    InterviewerID INT,
    PRIMARY KEY (InterviewID, InterviewerID),
    FOREIGN KEY (InterviewID) REFERENCES Interview(InterviewID) ON DELETE CASCADE,
    FOREIGN KEY (InterviewerID) REFERENCES Employee(PersonID)
);

-- Table: InterviewGrade
CREATE TABLE InterviewGrade (
    InterviewID INT,
    InterviewerID INT,
    RoundNumber INT NOT NULL,
    Grade INT CHECK (Grade BETWEEN 0 AND 100),
    PRIMARY KEY (InterviewID, InterviewerID, RoundNumber),
    FOREIGN KEY (InterviewID) REFERENCES Interview(InterviewID) ON DELETE CASCADE,
    FOREIGN KEY (InterviewerID) REFERENCES Employee(PersonID)
);

-- Table: Product
CREATE TABLE Product (
    ProductID INT PRIMARY KEY,
    ProductType VARCHAR(50),
    Size VARCHAR(20),
    ListPrice DECIMAL(10, 2) CHECK (ListPrice > 0),
    Weight DECIMAL(5, 2) CHECK (Weight > 0),
    Style VARCHAR(20)
);

-- Table: Site
CREATE TABLE Site (
    SiteID INT PRIMARY KEY,
    SiteName VARCHAR(25),
    Location VARCHAR(25)
);

-- Table: EmployeeSiteAssignment
CREATE TABLE EmployeeSiteAssignment (
    EmployeeID INT,
    SiteID INT,
    StartDate DATE,
    EndDate DATE,
    PRIMARY KEY (EmployeeID, SiteID, StartDate),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(PersonID),
    FOREIGN KEY (SiteID) REFERENCES Site(SiteID)
);

-- Table: Sale
CREATE TABLE Sale (
    SalesID INT PRIMARY KEY,
    SalesPersonID INT,
    CustomerID INT,
    ProductID INT,
    SiteID INT,
    SalesTime TIMESTAMP,
    Amount DECIMAL(10,2) CHECK (Amount > 0),
    FOREIGN KEY (SalesPersonID) REFERENCES Employee(PersonID),
    FOREIGN KEY (CustomerID) REFERENCES Customer(PersonID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID),
    FOREIGN KEY (SiteID) REFERENCES Site(SiteID)
);

-- Table: Vendor
CREATE TABLE Vendor (
    VendorID INT PRIMARY KEY,
    Name VARCHAR(50),
    AddressLine1 VARCHAR(50),
    AddressLine2 VARCHAR(50),
    City VARCHAR(50),
    State VARCHAR(13),
    ZipCode INT,
    AccountNumber VARCHAR(20) UNIQUE,
    CreditRating INT CHECK (CreditRating BETWEEN 0 AND 10),
    PurchasingWebServiceURL VARCHAR(255)
);

-- Table: Part
CREATE TABLE Part (
    PartID INT PRIMARY KEY,
    ProductID INT,
    Quantity INT CHECK (Quantity > 0),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

-- Table: VendorPart
CREATE TABLE VendorPart (
    VendorID INT,
    PartID INT,
    Price DECIMAL(10, 2) CHECK (Price > 0),
    PRIMARY KEY (VendorID, PartID),
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID) ON DELETE CASCADE,
    FOREIGN KEY (PartID) REFERENCES Part(PartID)
);

-- Table: ProductPart
CREATE TABLE ProductPart (
    ProductID INT,
    PartID INT,
    Quantity INT CHECK (Quantity > 0),
    PRIMARY KEY (ProductID, PartID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID),
    FOREIGN KEY (PartID) REFERENCES Part(PartID)
);

-- Table: Salary
DROP TABLE IF EXISTS Salary;
CREATE TABLE Salary (
    EmployeeID INT,
    TransactionNumber INT,
    PayDate DATE,
    Amount INT,
    PRIMARY KEY (EmployeeID, TransactionNumber),
    FOREIGN KEY (EmployeeID) REFERENCES Person(PersonID)
);

-- Views
-- View1: Average monthly salary for each employee
CREATE VIEW EmployeeAverageSalary AS
SELECT 
    e.PersonID,
    CONCAT(p.FirstName, ' ', p.LastName) AS EmployeeName,
    AVG(s.Amount) AS AverageMonthlySalary
FROM Employee e
JOIN Person p ON e.PersonID = p.PersonID
JOIN Salary s ON e.PersonID = s.EmployeeID
GROUP BY e.PersonID, p.FirstName, p.LastName;

-- View2: Number of interview rounds passed by each interviewee for each job
CREATE VIEW InterviewRoundsPassed AS
SELECT 
    i.CandidateID,
    CONCAT(p.FirstName, ' ', p.LastName) AS CandidateName,
    i.JobID,
    jp.JobDescription,
    COUNT(DISTINCT ig.RoundNumber) AS PassedRounds
FROM Interview i
JOIN Person p ON i.CandidateID = p.PersonID
JOIN JobPosition jp ON i.JobID = jp.JobID
JOIN InterviewGrade ig ON i.InterviewID = ig.InterviewID
WHERE ig.Grade >= 60
GROUP BY i.CandidateID, p.FirstName, p.LastName, i.JobID, jp.JobDescription;

-- View3: Number of items sold for each product type
CREATE VIEW ProductTypeSales AS
SELECT 
    p.ProductType,
    COUNT(s.SalesID) AS TotalItemsSold,
    SUM(s.Amount) AS TotalSalesAmount
FROM Product p
LEFT JOIN Sale s ON p.ProductID = s.ProductID
GROUP BY p.ProductType;

-- View4: Part purchase cost for each product
CREATE VIEW ProductPartCost AS
SELECT 
    p.ProductID,
    p.ProductType,
    SUM(pp.Quantity * vp.Price) AS TotalPartCost
FROM Product p
JOIN ProductPart pp ON p.ProductID = pp.ProductID
JOIN VendorPart vp ON pp.PartID = vp.PartID
GROUP BY p.ProductID, p.ProductType;
