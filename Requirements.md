XYZ Company is a business that procures certain parts from vendors to manufacture its products. The company operates through multiple departments, manages marketing sites, and collaborates with a network of parts supply vendors. 

 

Requirements: 

For each department, the system records the Department ID and Department Name. 

People in the company are categorized into three types: employees, customers, and potential employees. A person can belong to multiple categories simultaneously. Everyone is associated with the following attributes: 

Personal ID 

Name (Last Name, First Name) 

Age (must be below 65) 

Gender 

Address (Address Line 1, Address Line 2, City, State, Zip code) 

Phone number (an individual may have multiple phone numbers). 

For customers, the system tracks their preferred sales representatives. For employees, the system records their Rank and Title (e.g., CEO, Principal, Partner, etc.). 

Each employee must have exactly one direct supervisor, while a supervisor can oversee multiple supervisees. An employee may work for one or more departments over time, but at any given time, they can only be assigned to one department. The system tracks the start time and end time for each shift within different departments. 

 

Each job position’s information is recorded to hire new people. It contains the Job ID, job description, and posted date in the system. 

 

The job positions are posted by the departments. Both existing employees and potential employees can apply for each job post by any department. The company will select some candidates from the applications and conduct interviews. 

Multiple interviews are conducted for each job position to find the most suitable candidate. 

 

For each interview, candidates (interviewees), interviewers, job position and interview time are recorded. After each round interview, the interviewers give a grade to it ranging from 0 to 100. The grade over 60 represents that the interviewee passes the interview. One person is selected when her/his average grade is over 70 and she/he passes at least 5 rounds of interviews. 

 

For each product in the company, the system needs to record Product ID, Product Type, Size, List Price, Weight, and Style. 

 

There are many marketing sites for the company. For each site, Site ID, Site Name, and Site Location are recorded. 

 

There are several people working for each site, and meanwhile, one person can work on different sites. It can track the details of each sale history --- salesmen, customers, product, sale time, and sites. 

 

Part purchase is also a vital activity in the company. The system needs to record each vendor’s Vendor ID, Name, Address, Account Number, Credit Rating, and Purchasing Web Service URL. 

 

One vendor may supply many types of parts. The price of the same part type may vary from different vendors but the price of one part type of one vendor will keep same. It is able to track which part types are used in each product and the number of each type of part used for the product. 

 

In addition, the system maintains the information of each employee’s monthly salary which includes transaction number, pay date, and amount (Note: transaction number could be same among different employees. However, for each employee, the transaction number is unique). 

 

  

 

 

 

 

Project Questions 

Can you think of 5 more rules (other than the one explicitly described above) that are likely to be used in a company. 

 

Is the ability to model super-class/subclass relationships likely to be important in such an environment? Why or why not? 

 

Justify using a Relational DBMS like Oracle for this project. 

 

Project Exercises 

I. Draw an ER & an EER diagram if required based on project question #2 above to accurately represent this set of requirements. This will be your Conceptual Design. Clearly specify any assumption that you are making. You can use any tools (software) to draw the ER & EER. You don’t need to describe the value constraints of the attributions in the ER & EER diagram. (25%)  

 

II. Use a relational DBMS to implement the database. Perform the following steps. (20%)  

a) Convert your Conceptual model to a Logical model that can be implemented in a relational DBMS like Oracle. During this process you replace M-N relationships and multi-valued attributes that can be implemented in relational DBMS. Draw EER for the logical model after your modifications. Feel free to change your conceptual model (first delivery) if needed. 

 

b) Convert the ER & EER to a database design. Document your design in Database Schema format like the one we discussed in the class. 

 

III. Use appropriate naming conventions for all your tables and attributes. (40%) 

a) Normalize all your tables to third normal form. Make any necessary changes to the EER. Explain why these changes need to be made. 

b) Draw a dependency diagram for each table 

c) Write SQL statements to create the database, tables, and all other structures. Primary keys and foreign keys must be defined appropriately. The quantity constraints of the relation between the entities, which should be described in EER diagram, are not required. 

 

d) Use the Create View statement to create the following views: 

1) View1: This view returns the average salary each employee has earned from the company monthly after she/he becomes an employee in the company. 

2) View2: This view returns the number of interviews rounds each interviewee passes for each job position. 

3) View3: This view returns the number of items of each product type sold. 

4) View4: This view returns the part purchase cost for each product. 

 

e) Answer the following Queries. Feel free to use any of the views that you created in part (d). 

1) Return the ID and Name of interviewers who participate in interviews where the interviewee’s name is “Hellen Cole” arranged for job “11111”. 

2) Return the ID of all jobs which are posted by department “Marketing” in January 2011. 

3) Return the ID and Name of the employees who have no supervisees. 

4) Return the Id and Location of the marketing sites which have no sale records during March 2011. 

5) Return the job’s id and description which does not hire a suitable person one month after it is posted. 

6) Return the ID and Name of the salesmen who have sold all product type whose price is above $200. 

7) Return the department’s id and name which has no job post during 1/1/2011 and 2/1/2011. 

8) Return the ID, Name, and Department ID of the existing employees who apply job “12345”. 

9) Return the best seller’s type in the company (sold the most items). 

10) Return the product type whose net profit is highest in the company (money earned minus the part cost). 

11) Return the name and id of the employees who have worked in all departments after hired by the company. 

12) Return the name and email address of the interviewee who is selected. 

13) Retrieve the name, phone number, email address of the interviewees selected for all the jobs they apply for. 

14) Return the employee’s name and id whose average monthly salary is highest in the company. 

15) Return the ID and Name of the vendor who supply part whose name is “Cup” and weight is smaller than 4 pound and the price is lowest among all vendors. 

 

IV. Documentation required for the semester project report. (15%)  

a) Problem description  

b) Project questions (Answer questions listed in this project). 

c) ER & EER diagram with all assumptions. 

d) Relation schema after normalization. All relations must be in 3NF. The relation schema should include primary keys as well as foreign keys (if any) for all relations. 

e) All requested SQL statements. 

f) Dependency diagram. 