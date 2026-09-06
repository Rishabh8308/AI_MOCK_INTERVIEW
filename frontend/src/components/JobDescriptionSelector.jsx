import { useState } from 'react';

const jobDescriptions = {
  'Business Analyst': `Job Title: Business Analyst

Role Summary:
We are looking for a Business Analyst to join our team. This role is suitable for candidates who are eager to analyze business requirements, identify opportunities for improvement, and help deliver data-driven solutions.

Responsibilities:
- Work closely with business teams and stakeholders to understand requirements.
- Analyze business processes and identify areas for improvement.
- Translate business requirements into clear technical or functional specifications.
- Collaborate with development and product teams.
- Analyze data and prepare reports to support business decisions.
- Communicate findings and recommendations to stakeholders.

Requirements:
- Strong analytical and problem-solving skills.
- Good communication and stakeholder management skills.
- Understanding of business processes and requirements gathering.
- Familiarity with data analysis and reporting.
- Ability to work effectively with technical and non-technical teams.`,

  'Product Manager': `Job Title: Product Manager

Role Summary:
We are looking for a Product Manager to drive product strategy, define product requirements, and work with cross-functional teams to deliver products that solve real customer problems.

Responsibilities:
- Define product vision, strategy, and roadmap.
- Gather and prioritize customer and business requirements.
- Work closely with engineering, design, and business teams.
- Define product requirements and acceptance criteria.
- Analyze product performance and user feedback.
- Prioritize features based on business impact and customer value.
- Communicate product decisions and progress to stakeholders.

Requirements:
- Strong product thinking and problem-solving skills.
- Excellent communication and leadership abilities.
- Understanding of software development processes.
- Ability to prioritize competing requirements.
- Strong analytical and decision-making skills.`,

  'Software Engineer': `Job Title: Software Engineer

Role Summary:
We are looking for a Software Engineer to design, develop, test, and maintain reliable software applications. The ideal candidate should have strong programming fundamentals and the ability to solve complex technical problems.

Responsibilities:
- Design and develop scalable software applications.
- Write clean, maintainable, and efficient code.
- Debug and troubleshoot software issues.
- Write unit and integration tests.
- Collaborate with product managers, designers, and other engineers.
- Participate in code reviews and technical discussions.
- Improve application performance, reliability, and security.

Requirements:
- Strong programming and problem-solving skills.
- Understanding of data structures and algorithms.
- Familiarity with software development principles.
- Knowledge of version control systems such as Git.
- Ability to work effectively in a collaborative engineering environment.`,

  'Marketing Specialist': `Job Title: Marketing Specialist

Role Summary:
We are looking for a Marketing Specialist to develop and execute marketing strategies that increase brand awareness, customer engagement, and business growth.

Responsibilities:
- Plan and execute marketing campaigns.
- Conduct market and competitor research.
- Create and manage marketing content.
- Analyze campaign performance and marketing metrics.
- Collaborate with sales and product teams.
- Identify new opportunities for customer acquisition.
- Manage digital marketing channels and campaigns.

Requirements:
- Strong communication and creative thinking skills.
- Understanding of digital marketing principles.
- Analytical skills and familiarity with marketing metrics.
- Ability to manage multiple campaigns and priorities.
- Strong writing and presentation abilities.`,

  'Data Analyst': `Job Title: Data Analyst

Role Summary:
We are looking for a Data Analyst to collect, analyze, and interpret data to help teams make informed business decisions.

Responsibilities:
- Collect and clean data from multiple sources.
- Analyze datasets to identify trends and patterns.
- Build reports and dashboards.
- Communicate analytical findings to stakeholders.
- Work with business teams to understand analytical requirements.
- Identify opportunities for process and business improvement.
- Maintain accurate and reliable reporting systems.

Requirements:
- Strong analytical and problem-solving skills.
- Knowledge of SQL and data analysis techniques.
- Familiarity with spreadsheets and data visualization tools.
- Understanding of statistics and data interpretation.
- Ability to communicate technical findings clearly.`,

  'Customer Service Representative': `Job Title: Customer Service Representative

Role Summary:
We are looking for a Customer Service Representative to provide excellent customer support, resolve customer issues, and ensure a positive customer experience.

Responsibilities:
- Respond to customer questions and requests.
- Resolve customer issues efficiently and professionally.
- Maintain accurate customer records.
- Escalate complex issues when necessary.
- Follow company policies and service procedures.
- Communicate clearly with customers through multiple channels.
- Identify recurring customer problems and provide feedback to the team.

Requirements:
- Excellent verbal and written communication skills.
- Strong problem-solving abilities.
- Patience and empathy when working with customers.
- Ability to handle difficult situations professionally.
- Strong organizational and time-management skills.`,

  'Sales Representative': `Job Title: Sales Representative

Role Summary:
We are looking for a Sales Representative to generate new business, build strong customer relationships, and help achieve company revenue targets.

Responsibilities:
- Identify and contact potential customers.
- Understand customer needs and recommend appropriate solutions.
- Conduct product demonstrations and presentations.
- Maintain customer relationships throughout the sales process.
- Track leads and sales activities.
- Negotiate with customers and close deals.
- Meet and exceed sales targets.

Requirements:
- Strong communication and interpersonal skills.
- Persuasive and confident communication style.
- Good understanding of sales processes.
- Strong negotiation and relationship-building skills.
- Ability to work toward measurable targets.`,

  'Human Resources Specialist': `Job Title: Human Resources Specialist

Role Summary:
We are looking for an HR Specialist to support recruitment, employee relations, HR operations, and organizational development.

Responsibilities:
- Support recruitment and candidate screening.
- Coordinate interviews and onboarding activities.
- Maintain employee records and HR documentation.
- Support employee engagement initiatives.
- Assist with HR policies and procedures.
- Respond to employee questions and concerns.
- Prepare HR reports and maintain confidential information.

Requirements:
- Strong communication and interpersonal skills.
- Understanding of HR processes and employment practices.
- Good organizational and administrative skills.
- Ability to handle confidential information professionally.
- Strong problem-solving and people-management abilities.`,

  'UX/UI Designer': `Job Title: UX/UI Designer

Role Summary:
We are looking for a UX/UI Designer to create intuitive, accessible, and visually consistent digital experiences based on user needs and business goals.

Responsibilities:
- Conduct user research and understand user requirements.
- Create wireframes, prototypes, and high-fidelity designs.
- Design intuitive user interfaces and experiences.
- Collaborate with product managers and engineers.
- Conduct usability testing and gather user feedback.
- Improve designs based on research and product requirements.
- Maintain consistent design systems and visual patterns.

Requirements:
- Strong understanding of UX and UI design principles.
- Experience with design and prototyping tools.
- Strong visual and interaction design skills.
- Understanding of responsive design.
- Ability to communicate design decisions clearly.`,

  'QA Engineer': `Job Title: QA Engineer

Role Summary:
We are looking for a QA Engineer to ensure software quality through systematic testing, automation, and defect analysis.

Responsibilities:
- Design and execute software test cases.
- Identify, document, and track software defects.
- Perform functional, regression, and integration testing.
- Collaborate with developers to reproduce and resolve issues.
- Develop automated tests where appropriate.
- Verify fixes and maintain testing documentation.
- Contribute to improving software quality processes.

Requirements:
- Strong understanding of software testing principles.
- Knowledge of functional and regression testing.
- Familiarity with test automation concepts.
- Strong analytical and problem-solving skills.
- Good communication and attention to detail.`
};

const roles = [
  'Custom Job Description',
  'Business Analyst',
  'Product Manager',
  'Software Engineer',
  'Marketing Specialist',
  'Data Analyst',
  'Customer Service Representative',
  'Sales Representative',
  'Human Resources Specialist',
  'UX/UI Designer',
  'QA Engineer'
];

const JobDescriptionSelector = ({
  value = 'Custom Job Description',
  description = '',
  onChange
}) => {
  const [selectedRole, setSelectedRole] = useState(value);

  const handleRoleChange = (role) => {
    setSelectedRole(role);

    const newDescription =
      role === 'Custom Job Description'
        ? ''
        : jobDescriptions[role] || '';

    onChange({
      role,
      description: newDescription
    });
  };

  const handleDescriptionChange = (event) => {
    onChange({
      role: selectedRole,
      description: event.target.value
    });
  };

  const characterLimit = 5000;

  return (
    <div className="job-description-selector">
      <div className="job-description-heading">
        <h2>Select a job description</h2>
        <p>
          Pick a sample role or paste your own. The more detail you give,
          the sharper the questions.
        </p>
      </div>

      <div className="job-description-card">
        <div className="job-description-role-section">
          <div className="job-description-label">
            ROLE
          </div>

          <div className="job-description-role-list">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                className={`job-description-role ${
                  selectedRole === role ? 'selected' : ''
                }`}
                onClick={() => handleRoleChange(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="job-description-input-section">
          <div className="job-description-input-header">
            <div className="job-description-label">
              JOB DESCRIPTION
            </div>

            <span className="job-description-counter">
              {characterLimit - description.length} chars left
            </span>
          </div>

          <textarea
            value={description}
            maxLength={characterLimit}
            onChange={handleDescriptionChange}
            placeholder={
              selectedRole === 'Custom Job Description'
                ? 'Select a job role above or paste your own description here'
                : 'Job description'
            }
            required
          />
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionSelector;