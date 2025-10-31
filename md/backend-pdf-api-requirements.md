# Backend PDF API Requirements

## 🔧 **Backend API Endpoints Required**

### **1. Core PDF Operations**

#### **POST /v1/pdf/merge**
- **Purpose**: Merge multiple PDFs or any document types
- **Input**: 
  - `files[]` - Array of files (PDF, DOC, DOCX, images, etc.)
  - `page_selections[]` - Optional page ranges per file
  - `merge_order[]` - Order of files to merge
  - `metadata` - Title, author, keywords
- **Processing**: 
  - Convert non-PDF files to PDF first
  - Extract specified page ranges from each file
  - Merge in specified order
  - Apply metadata
- **Output**: Merged PDF file URL

#### **POST /v1/pdf/split**
- **Purpose**: Split PDF into multiple files
- **Input**:
  - `file` - PDF file to split
  - `split_points[]` - Page numbers where to split
  - `metadata` - Title prefix, author
- **Processing**:
  - Split PDF at specified points
  - Generate individual PDF files
  - Create ZIP archive with all split files
- **Output**: ZIP file URL with split PDFs

#### **POST /v1/pdf/edit**
- **Purpose**: Apply complex edits to PDF
- **Input**:
  - `file` - Original PDF file
  - `operations[]` - Array of edit operations
  - `metadata` - Document metadata
- **Processing**:
  - Apply page deletions, rotations, reordering
  - Handle complex transformations
  - Preserve document structure
- **Output**: Edited PDF file URL

#### **GET /v1/pdf/preview**
- **Purpose**: Generate thumbnail previews
- **Input**:
  - `file` - PDF file
  - `page_numbers[]` - Specific pages (optional)
  - `thumbnail_size` - Width/height for thumbnails
- **Processing**:
  - Extract page images
  - Generate thumbnails at specified size
  - Cache thumbnails for performance
- **Output**: Array of thumbnail URLs

### **2. Advanced PDF Features**

#### **POST /v1/pdf/watermark**
- **Purpose**: Add watermarks to PDF
- **Input**:
  - `file` - PDF file
  - `watermark_config` - Text/image watermark settings
  - `page_selection` - Which pages to apply to
- **Processing**:
  - Add text or image watermarks
  - Handle positioning, rotation, opacity
  - Apply to specified pages
- **Output**: Watermarked PDF file URL

#### **POST /v1/pdf/annotate**
- **Purpose**: Add annotations to PDF
- **Input**:
  - `file` - PDF file
  - `annotations[]` - Array of annotation objects
- **Processing**:
  - Add highlights, comments, drawings
  - Preserve PDF structure
- **Output**: Annotated PDF file URL

#### **POST /v1/pdf/page-numbers**
- **Purpose**: Add page numbering
- **Input**:
  - `file` - PDF file
  - `numbering_config` - Position, format, style
  - `page_ranges` - Which pages to number
- **Processing**:
  - Add customizable page numbers
  - Support different formats (1,2,3 / i,ii,iii)
- **Output**: Numbered PDF file URL

### **3. File Conversion & Processing**

#### **POST /v1/pdf/convert-to-pdf**
- **Purpose**: Convert any document to PDF
- **Input**:
  - `file` - Any document type
  - `options` - Conversion settings
- **Processing**:
  - Convert DOC, DOCX, PPT, PPTX, images to PDF
  - Maintain formatting and layout
  - Handle different page sizes
- **Output**: Converted PDF file URL

#### **POST /v1/pdf/compress**
- **Purpose**: Compress PDF files
- **Input**:
  - `file` - PDF file
  - `compression_level` - High/medium/low
  - `quality` - Image quality percentage
- **Processing**:
  - Apply compression algorithms
  - Optimize images within PDF
  - Reduce file size while maintaining quality
- **Output**: Compressed PDF file URL

### **4. Security & Protection**

#### **POST /v1/pdf/protect**
- **Purpose**: Add password protection
- **Input**:
  - `file` - PDF file
  - `password` - Protection password
  - `permissions` - What user can/cannot do
- **Processing**:
  - Encrypt PDF with password
  - Set user permissions
  - Apply security restrictions
- **Output**: Protected PDF file URL

#### **POST /v1/pdf/unlock**
- **Purpose**: Remove password protection
- **Input**:
  - `file` - Password-protected PDF
  - `password` - Current password
- **Processing**:
  - Verify password
  - Remove protection
- **Output**: Unlocked PDF file URL

### **5. Metadata & Properties**

#### **POST /v1/pdf/metadata**
- **Purpose**: Update PDF metadata
- **Input**:
  - `file` - PDF file
  - `metadata` - Title, author, subject, keywords
- **Processing**:
  - Update PDF document properties
  - Preserve existing structure
- **Output**: Updated PDF file URL

#### **GET /v1/pdf/info**
- **Purpose**: Get PDF information
- **Input**:
  - `file` - PDF file
- **Processing**:
  - Extract page count, file size, metadata
  - Analyze document structure
- **Output**: PDF information object

### **6. Batch Operations**

#### **POST /v1/pdf/batch-process**
- **Purpose**: Apply multiple operations at once
- **Input**:
  - `file` - PDF file
  - `operations[]` - Array of operations to apply
- **Processing**:
  - Apply multiple edits in sequence
  - Optimize processing pipeline
- **Output**: Processed PDF file URL

## 🛠 **Backend Infrastructure Requirements**

### **1. PDF Processing Libraries**
- **PyPDF2/PyPDF4** - Basic PDF manipulation
- **pdf-lib** (Python equivalent) - Advanced PDF operations
- **Pillow** - Image processing for thumbnails
- **reportlab** - PDF generation
- **pdf2image** - PDF to image conversion

### **2. Document Conversion**
- **LibreOffice** - Convert DOC/DOCX/PPT to PDF
- **pandoc** - Document format conversion
- **ImageMagick** - Image format conversion
- **Ghostscript** - PostScript/PDF processing

### **3. File Storage & Management**
- **Temporary file storage** - For processing files
- **File cleanup** - Remove old temporary files
- **CDN integration** - For serving processed files
- **File size limits** - Prevent abuse

### **4. Performance & Caching**
- **Redis** - Cache thumbnails and processed files
- **Background tasks** - For heavy processing
- **Queue system** - Handle multiple requests
- **Rate limiting** - Prevent API abuse

### **5. Error Handling**
- **Comprehensive error messages** - User-friendly errors
- **Logging** - Track processing issues
- **Retry mechanisms** - Handle temporary failures
- **Validation** - Input file validation

## 📋 **Implementation Priority**

### **Phase 1 (Essential)**
1. `POST /v1/pdf/merge` - Core merging functionality
2. `POST /v1/pdf/split` - PDF splitting
3. `POST /v1/pdf/edit` - Basic editing operations
4. `GET /v1/pdf/preview` - Thumbnail generation

### **Phase 2 (Enhanced)**
5. `POST /v1/pdf/watermark` - Watermark functionality
6. `POST /v1/pdf/convert-to-pdf` - Document conversion
7. `POST /v1/pdf/compress` - Compression options
8. `POST /v1/pdf/protect` - Password protection

### **Phase 3 (Advanced)**
9. `POST /v1/pdf/annotate` - Annotation tools
10. `POST /v1/pdf/page-numbers` - Page numbering
11. `POST /v1/pdf/batch-process` - Batch operations
12. `GET /v1/pdf/info` - PDF analysis

## 🔗 **Integration Points**

- **Authentication**: Use existing JWT system
- **File Upload**: Integrate with existing file upload system
- **Subscription Limits**: Apply usage limits to PDF operations
- **Notifications**: Use existing notification system
- **Error Handling**: Follow existing error response patterns

## 📝 **API Request/Response Examples**

### **Merge PDFs Request**
```json
POST /v1/pdf/merge
Content-Type: multipart/form-data

{
  "files": [file1.pdf, file2.docx, file3.jpg],
  "page_selections": [
    {
      "file_id": "file1.pdf",
      "page_ranges": [{"start": 1, "end": 5}]
    },
    {
      "file_id": "file2.docx", 
      "page_ranges": [{"start": 1, "end": 3}]
    }
  ],
  "merge_order": ["file1.pdf", "file2.docx"],
  "metadata": {
    "title": "Merged Document",
    "author": "User Name",
    "keywords": ["document", "merge"]
  }
}
```

### **Merge PDFs Response**
```json
{
  "success": true,
  "message": "PDFs merged successfully",
  "merged_file_url": "/files/merged_123456.pdf",
  "download_url": "/download/merged_123456.pdf",
  "total_pages": 8,
  "processing_time": 2.5
}
```

### **Split PDF Request**
```json
POST /v1/pdf/split
Content-Type: multipart/form-data

{
  "file": "document.pdf",
  "split_points": [3, 7, 12],
  "metadata": {
    "title_prefix": "Chapter",
    "author": "User Name"
  }
}
```

### **Split PDF Response**
```json
{
  "success": true,
  "message": "PDF split successfully",
  "split_files": [
    {
      "name": "Chapter_1.pdf",
      "url": "/files/chapter_1.pdf",
      "page_count": 3
    },
    {
      "name": "Chapter_2.pdf", 
      "url": "/files/chapter_2.pdf",
      "page_count": 4
    }
  ],
  "zip_url": "/files/split_document.zip",
  "processing_time": 1.8
}
```

### **Watermark Request**
```json
POST /v1/pdf/watermark
Content-Type: multipart/form-data

{
  "file": "document.pdf",
  "watermark_config": {
    "type": "text",
    "content": "DRAFT",
    "position": {"x": 50, "y": 50},
    "size": {"width": 30, "height": 10},
    "rotation": -45,
    "opacity": 30,
    "color": "#000000",
    "font_family": "Arial",
    "font_size": 48
  },
  "page_selection": {
    "apply_to_all": true,
    "selected_pages": []
  }
}
```

## 🚨 **Error Response Format**

```json
{
  "success": false,
  "error": {
    "code": "PDF_PROCESSING_ERROR",
    "message": "Failed to process PDF file",
    "details": "Invalid PDF format or corrupted file",
    "timestamp": "2025-01-28T10:30:00Z"
  }
}
```

## 🔒 **Security Considerations**

- **File Validation**: Validate file types and sizes
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Require valid JWT tokens
- **Input Sanitization**: Sanitize all user inputs
- **Temporary Files**: Secure cleanup of temporary files
- **CORS**: Proper CORS configuration for frontend

## 📊 **Performance Requirements**

- **Response Time**: < 5 seconds for basic operations
- **File Size Limit**: 50MB per file, 200MB total per request
- **Concurrent Requests**: Support 100+ concurrent users
- **Caching**: Cache thumbnails for 24 hours
- **Cleanup**: Remove temporary files after 1 hour

The backend needs to be robust, scalable, and handle various document formats while maintaining PDF quality and structure. The API should be designed to work seamlessly with the frontend components already built.


