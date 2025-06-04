# Conv3rt - Financial Statement Standardizer
![Picture](cropped_conv3rt.png)

# Introduction
Conv3rt is an AI-powered web application designed to automate the mapping and conversion of trial balances from various formats into a standardized schema. Moreover, by reducing manual cleanup and classification of accounts, Conv3rt helps accountants onboard new companies quickly and accurately.

## Hackathon Recognition
Pitched the solution at NTU CAO “Code with AI” Hackathon winning **1st Place** (SGD 1,000)
### Team Members
- Mengyi
- Yuanchi 
- Florian
- Yuancheng 
- Xiong Kai

## Motive

Accountants and financial teams often receive trial balances in inconsistent formats from different accounting software. Manually reformatting these spreadsheets and classifying account codes is time-consuming and error-prone. Conv3rt’s core motive is to leverage AI (OpenAI API) for automatic account classification and formatting, ensuring:
- **Reduced Errors**: Automated AI-driven classification minimizes human mistakes.
- **Consistent Formatting**: Every output follows a strict schema, guaranteeing compatibility with downstream systems.

## Key Features

- **Multi-format Upload**  
  - Accepts `.xls`, `.xlsx` and `.pdf` trial balance exports  
  - In-browser preview for Excel tables and PDF pages  
  - File size/type validation before upload  

- **AI-Powered Account Classification**  
  - Sends each trial balance line item to the OpenAI API for multi-level account classification (Type, Primary, Secondary, Tertiary)  
  - Uses a prompt template:  
    > “You are a professional accountant with expertise in financial statement classification. You have access to a comprehensive classification structure for trial balance entries.”  
  - Stores AI’s predicted categories alongside raw data  

- **Excel Reformatting & JSON Storage**  
  - Reads Excel contents using `xlsx` (frontend) and `ExcelJS` (backend)  
  - Transforms raw columns into Automa8e’s required schema (e.g., reorder columns, rename headers)  
  - Persists reformatted rows as a JSONB object in the database for quick retrieval  

- **CRUD Operations & Download**  
  - View a paginated table of all uploaded files (Excel & PDF) with metadata flags (“Converted”, “Reformatted”)  
  - Edit or delete file metadata (e.g., toggle reformat/reclassification)  
  - Download processed files directly from Supabase Storage  

- **Conversion Tracking & Metadata**  
  - Flags to indicate whether an Excel file was generated from a PDF  
  - Automatic PDF-quality checks (text encoding, embedded fonts, Unicode validity) via database triggers  
  - Timestamped records for auditing and versioning  

## How It Works

1. **User Authentication**  
   - Users sign up / sign in with email & password through Supabase Auth  
   - Auth state is managed in the React frontend; on success, a JWT session token is issued  

2. **Uploading a File**  
   - User navigates to “Upload PDF” or “Upload Excel” page  
   - Frontend validates file type/size; shows a preview:  
     - PDF preview via `pdfjs-dist`  
     - Excel preview by parsing the sheet in the browser and rendering a table  
   - On clicking “Upload,” the file is sent via Axios to an Express endpoint  

3. **Backend Processing (Express + Node.js)**  
   - **Multer** handles multipart form data and streams the file to Supabase Storage  
   - For **PDFs**:  
     - Stored in Supabase “files” bucket  
     - A new record is inserted into `files` table with metadata (filename, user_id, file_category = “PDF”)  
     - Database triggers populate PDF-quality columns (`text_encoding`, `embedded_fonts`, `unicode_valid`)  
   - For **Excel**:  
     - Raw `.xls`/`.xlsx` also saved to Supabase Storage  
     - **ExcelJS** parses each row server-side; columns are mapped to Automa8e’s standardized schema  
     - Each line item is sent to the OpenAI API for classification  
     - Full reformatted worksheet is saved as JSONB in the `excel_data` column of `files` table; metadata flags (`is_converted_from_pdf`, `reformatted`) are set accordingly  

4. **Listing & Editing Files**  
   - Frontend fetches a paginated list of `files` records via Supabase REST or RPC  
   - Table displays: filename, type, upload timestamp, AI classification status, conversion flags  
   - Clicking a row opens a detail modal where users can:  
     - View raw vs. reformatted data  
     - Toggle “reformatted” or “converted” flags (update triggers PATCH to Supabase)  
     - Download the file (signed URL from Supabase Storage)  

5. **Future Conversion Workflow (Extension)**  
   - Selecting a PDF in the file list can trigger a background conversion service (e.g., using Jigsawstack vOCR + OpenAI)  
   - The generated Excel is returned to backend, saved with `converted_from_file_id` referencing the original PDF, and flagged appropriately  

## Architecture & Tech Stack


### Development Process & Methodology

1. **Problem Definition & Goals**  
   - Identified pain point: inconsistent trial balance schemas across accounting software  
   - Goal: Build a front-end to accept PDFs/Excels, reformat data, and classify accounts using AI  

2. **Data Flow & AI Integration**  
   - Uploaded Excel rows → cleaned/reformatted → formatted payload → OpenAI API call for multi-level classification → store classification alongside raw entry → build final standardized sheet  

3. **Prompt Design & AI Tuning**  
   - Prompt example for account classification:  
     > “You are a professional accountant with expertise in financial statement classification. You have access to a comprehensive classification structure for trial balance entries.”  
   - Iterated prompt templates to improve accuracy (primary, secondary, tertiary categories)  

4. **Frontend Rapid Prototyping**  
   - Used bolt.new to quickly scaffold UI components (file upload, preview tables, modals)  
   - Hooked into Netlify for continuous deployment of the frontend  

5. **Backend Implementation**  
   - Built Express endpoints, integrated Multer for streaming uploads to Supabase Storage  
   - Wrote database migration SQLs to define `files` table, ENUM types, triggers, and RLS policies  
   - Created a local `classifications.json` to map certain account codes, supplementing AI classification  

6. **Testing & Iteration**  
   - Manual testing with sample trial balance exports from multiple accounting packages (QuickBooks, Sage, Xero)  
   - Validated AI-predicted categories against known benchmarks; refined mapping logic for edge cases  
