# Product Requirements Document: SwiftNotes

**Version:** 1.0
**Date:** June 3, 2025
**Status:** Final Draft

## 1. Introduction / Overview

### 1.1. Purpose
SwiftNotes is a web application designed to assist professionals (e.g., therapists, support staff) in efficiently writing structured, personalized notes based on predefined tasks (e.g., from an Individualized Service Plan - ISP) and the user's unique writing style.

### 1.2. Problem Solved
Writing detailed, repetitive, yet individualized notes is time-consuming. SwiftNotes aims to reduce documentation time while maintaining the quality and personalization of notes, allowing professionals to focus more on direct service.

### 1.3. Target Audience
Professionals in fields requiring regular, structured note-taking based on individualized plans, such as therapists, social workers, direct support professionals, and case managers, particularly those using systems like Therap or similar ISP-driven documentation.

### 1.4. Vision
To establish SwiftNotes as the leading AI-powered assistant that intelligently automates and enhances the quality of professional note-writing, seamlessly integrating into existing workflows and learning individual user styles.

### 1.5. Branding & Domain
* **Product Name:** SwiftNotes
* **Intended Website:** `swiftnotes.app`

## 2. Goals / Objectives

### 2.1. Business Goals
* Create a monetizable SaaS product with a recurring revenue stream (credit-based system).
* Achieve a high user adoption rate within the target professional communities.
* Establish a reputation for reliability, security, and significant time-saving.

### 2.2. User Goals
* Significantly reduce the time and effort required to write daily/weekly notes.
* Ensure notes accurately reflect the user's writing style and the specifics of the service provided.
* Maintain compliance with documentation standards by addressing all required ISP tasks.
* Easily manage and retrieve past notes.

### 2.3. Success Metrics (Initial)
* Number of active registered users.
* Average time spent generating a note vs. manual writing (user-reported or estimated).
* Credit purchase rates and average revenue per user (ARPU).
* User satisfaction scores (e.g., CSAT, NPS).
* Task completion rate (percentage of ISP sections filled using AI generation).

## 3. Target Audience / User Personas

### 3.1. Primary Persona: The Direct Support Professional (DSP) / Therapist
* **Needs:** Quickly and accurately document interactions, services provided, and progress towards goals for multiple individuals. Must adhere to specific ISP task descriptions. Writing style needs to be professional and consistent.
* **Pain Points:** Repetitive nature of notes, time constraints, ensuring all ISP points are covered, maintaining a consistent personal style across many notes.
* **Motivations:** More time for direct client interaction, reduced administrative burden, accurate and compliant record-keeping.

## 4. Product Features & Functionality

### 4.1. User Account Management
* 4.1.1. Secure user registration (email/password).
* 4.1.2. Secure user login and session management.
* 4.1.3. User profile management (e.g., option to update/replace style sample).
* 4.1.4. Password recovery.

### 4.2. Initial Setup & Style Learning
* 4.2.1. **ISP Task Ingestion:**
    * Users can upload a screenshot of their ISP sections/task list.
    * The system will use OCR to attempt to parse these tasks into distinct sections for note generation.
    * Manual override/editing of OCR'd tasks will be available if OCR is imperfect.
    * (MVP alternative: Manual input of ISP tasks).
* 4.2.2. **Writing Style Input & Learning:**
    * Users can submit a sample of their previous writing (e.g., a sanitized Therap note, max 3000 characters) for the AI to learn their unique writing style. This sample is stored per user.
    * **On-Page User Guidance for Style Sample Submission:** Before submitting the style sample, the application will display clear instructions as follows:

        ---
        **(On the Web App Page - e.g., "Step 2: Teach Us Your Writing Style")**

        **Important: Preparing Your Writing Style Sample (Max 3000 Characters)**

        To help our AI learn your unique writing style, please paste a sample of one of your previous notes (up to 3000 characters) into the box below. This sample will teach the AI *how* you typically write, so it can generate future notes that sound like you.

        Please follow these tips carefully to get the best results:

        **1. What to Remove (Sanitize for Privacy):**
        * **Focus:** The main goal is to remove any client-specific or sensitive information.
        * **Please Remove or Generalize:**
            * Client Names & Initials: Change "John Doe" or "J.D." to "the individual," "the client," or "they."
            * Specific Dates of Birth, Ages (if identifiable): You can say "an adult individual" or "a youth participant."
            * Precise Addresses & Locations (if identifiable): Change "123 Main St." to "their residence," "the facility," or "the community setting."
            * Unique Identifying Numbers or Details.
            * Any other information that could directly identify a specific person (PHI/PII).
        * **Example:**
            * *Original:* "Jane S. (DOB: 05/15/1988) met with Dr. Smith at our Oak Street clinic on Monday for her weekly CBT session where she discussed her anxiety about the upcoming job interview at Acme Corp."
            * *Sanitized Example:* "The individual met with staff at the facility for their scheduled session. They discussed their progress on treatment goals, including managing anxiety related to a future vocational opportunity."

        **2. What to Keep (Preserve Your Unique Style!):**
        * **This is Key!** The AI needs to learn *your* way of writing.
        * **Please Keep:**
            * Your typical sentence structure: Do you use longer, more descriptive sentences or shorter, direct ones?
            * Your professional tone: Objective, empathetic, formal, etc.
            * Common professional vocabulary & phrasing: The terms and expressions you regularly use (as long as they aren't specific to one client's unique situation).
            * Level of detail: How descriptive are you generally?
        * ⚠️ **Avoid Over-Sanitizing Your Style:**
            * If you remove *too much* of your characteristic language (beyond the sensitive details mentioned above), the style sample might become too bland. This could result in the AI generating notes that don't quite sound like you.
            * **The goal is for the sanitized sample to still clearly reflect *your distinct way of writing*.**

        **3. Using Specific Jargon & Details in Your Daily Notes:**
        * **What if some specific (but non-sensitive) jargon gets removed during sanitization of *this* style sample?** Don't worry!
        * **For Future Notes:** When you are prompted to enter a sentence or two for a *new* note section (e.g., for "Individual will shower daily..."), *that's* the place to include any specific keywords, professional jargon, or relevant details for the current situation.
        * The AI is designed to:
            1.  Learn your general writing *style* from this sanitized sample.
            2.  Take the *specific content and terms* from your short daily prompts (and the ISP task descriptions) when drafting new notes.

        **In Summary:**
        * This **Style Sample** teaches the AI *how* you write.
        * Your **Daily Prompts** (the short sentences you'll enter later for each task) will tell the AI *what* to write about for each specific note.

        Ready? Paste your sanitized sample note below:

        **(Text Area for ~3000 character input would appear here)**
        ---

### 4.3. Note Generation Interface & Workflow
* 4.3.1. The interface will dynamically display sections based on the ingested/inputted ISP tasks.
* 4.3.2. Each ISP task section will have:
    * The task description clearly displayed.
    * A small text input field for the user to provide a brief sentence or a few keywords as a prompt for that specific task.
    * A larger text area (max 3000 characters, with counter) where the AI-generated content will appear.
    * A "Generate" button specific to that task section.
* 4.3.3. A dedicated "General Comments" section with its own input field, generation button, and output area (max 3000 characters, with counter).
* 4.3.4. All text input fields for AI generation will display a character counter relative to the 3000-character limit for output.

### 4.4. AI-Powered Content Generation
* 4.4.1. Upon clicking "Generate" for a task/comment section:
    * The system sends the ISP task description, the user's short input for that section, and the user's learned writing style to the LLM.
    * The LLM generates a response tailored to the prompt and style.
    * Task section generations aim for a "small reasonable size answer."
    * Comment section generations aim for a "medium size answer."
    * Generated answers must be strictly based on the user's input and the task context, rendered in the user's learned style.
* 4.4.2. **Editing:** Users can freely edit any AI-generated text within the output boxes.

### 4.5. Note History & Management
* 4.5.1. Completed notes (a collection of all task sections and comments for one session/ISP) are saved to the user's account.
* 4.5.2. Users can view a list of their saved notes, filterable/sortable by date and time of completion.
* 4.5.3. Users can view the full content of a saved note.
* 4.5.4. Users can delete entire notes from their account.

### 4.6. Credit System & Billing
* 4.6.1. **Credit-Based Generations:**
    * Each AI generation consumes credits.
    * Task section generation: 1 credit (example value, final TBD, e.g., $0.25 equivalent).
    * Comment section generation: 2 credits (example value, final TBD, e.g., $0.50 equivalent).
* 4.6.2. **Free Tier:** New users receive a one-time grant of free credits (e.g., 3 task generations and 3 comment generations).
* 4.6.3. **Account Top-up:** Users can purchase credits in predefined packages (e.g., $5, $10, $25, $50).
* 4.6.4. Credit balance is clearly displayed to the user.
* 4.6.5. Users are warned if they attempt generation with insufficient credits.

## 5. Technical Considerations

### 5.1. Frontend
* Framework: React, Vue.js, or Angular.
* Responsive design for desktop and tablet use.
* Handles image uploads, dynamic form generation, text inputs with counters, real-time updates.

### 5.2. Backend
* Language/Framework: Node.js (with Express.js), Python (with Django/Flask), Ruby on Rails.
* Manages user authentication, business logic, API integrations, database operations.

### 5.3. Database
* Type: PostgreSQL, MySQL (SQL) or MongoDB (NoSQL).
* Schema to store: `Users` (id, email, password_hash, style_sample_sanitized, credits, consent_for_model_improvement_data_use flag), `ISPs_Tasks` (parsed tasks), `Notes` (id, user_id, created_at, content as JSON or structured text), `Note_Sections`, `Transactions`.

### 5.4. OCR (Optical Character Recognition)
* Libraries/Services: Tesseract.js (client-side), Google Cloud Vision AI, AWS Textract, or other server-side Tesseract wrappers. Accuracy and error handling are key.

### 5.5. AI/LLM Integration
* **Initial Method: In-Context Learning via API:** Integration with **Google's Gemini 1.5 series (e.g., Gemini 1.5 Pro) via its API** for all AI text generation tasks.
* **Prompt Engineering:** Critical for style adherence, content relevance, and conciseness. Prompts will include user's style sample, task description, and user's short input.
* **Future Consideration: Continuous Learning/Fine-Tuning:** If significant sanitized data is collected (with consent), explore fine-tuning a base LLM for improved performance and potentially reduced per-call prompting needs. This is a long-term R&D effort.

### 5.6. Payment Gateway Integration
* Stripe or PayPal for secure credit purchases.

### 5.7. Security
* HTTPS for all communications.
* Secure password hashing.
* Protection against common web vulnerabilities (XSS, CSRF, SQLi).
* Data encryption at rest for sensitive user data (style samples, notes).
* Regular security audits.

## 6. User Experience (UX) and Design Considerations

### 6.1. Clarity & Guidance
* Extremely clear instructions for the style sample submission process, including sanitization requirements and tips (as per section 4.2.2).
* Intuitive workflow for selecting/inputting ISP tasks and generating notes.
* Visible character counters and credit balance.

### 6.2. Efficiency
* The primary goal is to save users time. The interface should be fast and responsive.

### 6.3. Feedback
* Provide clear feedback on actions (e.g., "Note Saved," "Generation in Progress," "Insufficient Credits").

### 6.4. Error Handling
* Graceful handling of errors (e.g., OCR failure, AI generation issues, network problems) with clear messages.

### 6.5. Trust & Transparency
* Be transparent about AI usage and data handling (especially regarding style samples and note content).

## 7. Release Criteria / Phases

### 7.1. Phase 1: Core MVP (Minimum Viable Product)
* User authentication.
* Prominent user instruction for style sample data sanitization (as per 4.2.2).
* Manual input for ISP tasks.
* Sanitized writing style input and storage.
* Basic note generation (in-context learning) for one task/comment section using LLM API.
* Ability to save and view generated content as a single note.
* Basic free use counter (no paid credits yet).

### 7.2. Phase 2: ISP Integration & UI Refinement
* Implement OCR for ISP task extraction from screenshots with manual override.
* Dynamic note-taking interface based on extracted tasks.
* Refine LLM prompting for better style adherence and relevance.
* Implement in-place editing of generated text.

### 7.3. Phase 3: Credit System & Full Functionality
* Implement the full credit tracking system (free uses, deductions).
* Integrate payment gateway for account top-ups.
* Full note history, time/date stamping, deletion functionality.
* Formalize consent mechanism for potential future data use in model improvement.

### 7.4. Phase 4: Polish & Advanced AI Capabilities
* UI/UX enhancements based on user feedback.
* More robust error handling.
* Begin R&D for Continuous Learning/Fine-Tuning if sufficient sanitized data is collected (with explicit user consent).

## 8. Success Metrics / KPIs (Post-Launch)

* User acquisition rate.
* User retention rate / Churn rate.
* Daily Active Users (DAU) / Monthly Active Users (MAU).
* Average number of notes generated per user per week/month.
* Credit purchase frequency and average transaction value.
* Customer lifetime value (CLV).
* User-reported time savings.
* Feature adoption rates (e.g., OCR usage vs. manual task input).

## 9. Future Considerations / Potential Enhancements

* 9.1. **Advanced AI - Continuous Learning/Fine-Tuning:** As described in 5.5.
* 9.2. **Team/Organizational Accounts:** Features for supervisors to manage team members, share ISP templates (if applicable), or review notes (with appropriate permissions and privacy considerations).
* 9.3. **Template Library:** Allow users to save common ISP structures or note templates.
* 9.4. **Direct Integrations:** Explore possibilities for integrating with existing EMR/EHR or documentation platforms (highly complex, long-term).
* 9.5. **Advanced Analytics:** Provide users with insights into their note-writing habits or trends (if valuable and privacy-preserving).

## 10. Open Questions / Assumptions

* **Assumption:** Users are willing to upload screenshots of ISP tasks (even if they need to be careful about PII in the screenshot itself, if any).
* **Assumption:** Users can provide a representative, sanitizable sample of their writing.
* **Assumption:** The quality of LLM generation using Google Gemini 1.5 series, combined with good prompting and style learning, will be high enough to provide significant value.
* **Open Question:** What is the optimal pricing for credits and credit packages? (Requires market research and testing).
* **Open Question:** What are the most common formats of ISP task lists, and how will this impact OCR design?

## 11. Risks and Mitigations

### 11.1. OCR Inaccuracy
* **Risk:** OCR fails to accurately parse ISP tasks from screenshots.
* **Mitigation:** Provide clear guidance on screenshot quality. Implement robust manual editing tools for OCR'd tasks. Continuously improve OCR logic or explore better OCR services.

### 11.2. AI Generation Quality/Relevance
* **Risk:** AI generates irrelevant, inaccurate, or poorly styled content.
* **Mitigation:** Extensive prompt engineering and testing with Google Gemini 1.5 series. Clear user guidance on providing good short prompts. Easy editing of generated content. Collect user feedback on generation quality to inform prompt adjustments.

### 11.3. User Input Quality (Style Sample & Prompts)
* **Risk (Over-Sanitization):** Users over-sanitize style samples by removing too much characteristic language (beyond just PII/PHI), the learned style may become overly bland, impacting the distinctiveness of generated outputs.
* **Mitigation:** Detailed on-page guidance (as per 4.2.2) with examples on effective sanitization that preserves style.
* **Risk (Vague Prompts):** Users provide vague short prompts, leading to generic AI output.
* **Mitigation:** Educate users on writing effective short prompts. Provide examples.

### 11.4. Data Privacy and Security
* **Risk:** Breach of user data, especially style samples or note content (even if sanitized).
* **Mitigation:** Strong emphasis on user-side sanitization of PII/PHI. Robust security measures (encryption, secure coding, access controls). Transparent privacy policy and user consent for data use (especially for model improvement).

### 11.5. LLM API Costs and Reliance
* **Risk:** High API costs associated with Google Gemini 1.5 series (or the specific Gemini model used). Google changes its API, pricing, or terms of service for the Gemini API.
* **Mitigation:** Optimize API calls. Price credit system appropriately. Stay informed about Google Gemini API terms. Explore different Gemini model tiers if available for cost-performance balance.

### 11.6. User Adoption
* **Risk:** Professionals are hesitant to adopt new AI tools or trust them with sensitive tasks.
* **Mitigation:** Focus on a simple, intuitive UX for SwiftNotes. Clearly demonstrate value (time-saving, quality). Offer a free trial/credits. Build trust through transparency and security.

---