# Visa Eligibility RAG System
## Bilingual Green Card Case Tracking & AI Assistant

**Portfolio Project for Software Engineering Applications**

---

### 🚀 Project Overview

A comprehensive, bilingual (English/Chinese) green card eligibility and case tracking system with AI-powered assistance. This application provides end-to-end support for green card applicants with intelligent case management and real-time progress monitoring.

**GitHub Repository:** [github.com/ethanzhanghello/visa-eligibility-rag](https://github.com/ethanzhanghello/visa-eligibility-rag)

---

### 🎯 Key Features

- **Interactive Case Tracking** - Real-time progress monitoring with visual timelines
- **Bilingual Support** - Full English and Chinese (Simplified) interface
- **Smart Notifications** - Automated alerts for upcoming deadlines and requirements
- **Document Management** - Centralized access to forms, checklists, and resources
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- **Admin Portal** - Comprehensive case management with analytics dashboard
- **AI Estimation Engine** - Intelligent completion date predictions

---

### 🛠️ Technology Stack

#### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom components
- **React i18next** - Internationalization support
- **Inter + Noto Sans SC** - Optimized typography for English/Chinese

#### Backend & Data
- **Next.js API Routes** - RESTful API endpoints
- **In-Memory Storage** - Real-time data management
- **Estimation Engine** - AI-powered prediction algorithms
- **Processing Time Analysis** - Historical data patterns

#### Development Tools
- **TypeScript** - Comprehensive type definitions
- **PostCSS** - CSS processing
- **ESLint** - Code quality assurance
- **Git** - Version control with 82 commits

---

### 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Dashboard│    │   Admin Portal  │    │   API Layer     │
│                 │    │                 │    │                 │
│ • Case Tracking │◄──►│ • Case Management│◄──►│ • RESTful APIs  │
│ • Timeline View │    │ • Stage Updates │    │ • Data Storage   │
│ • Notifications │    │ • Analytics     │    │ • Estimation    │
│ • Documents     │    │ • Real-time Sync│    │ • Calculations   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Estimation Engine│
                       │                 │
                       │ • AI Predictions│
                       │ • Country Delays│
                       │ • Confidence    │
                       └─────────────────┘
```

#### Data Flow
1. User accesses dashboard for case tracking
2. Admin portal manages case stages and updates
3. API layer processes requests and updates data
4. Estimation engine calculates completion dates
5. Real-time synchronization between interfaces
6. Smart notifications based on case status

---

### 💻 Technical Implementation

#### Frontend: Next.js + TypeScript

```typescript
// Case tracking with real-time updates
interface CaseData {
  id: string;
  visaType: 'EB-1' | 'EB-2' | 'EB-3';
  countryOfBirth: string;
  currentStage: number;
  stages: CaseStage[];
  estimatedCompletion: Date;
  confidence: 'high' | 'medium' | 'low';
}

// Intelligent estimation engine
export class EstimationEngine {
  calculateCompletionDate(caseData: CaseData): Date {
    const baseTime = this.getBaseProcessingTime(caseData.visaType);
    const countryDelay = this.getCountryDelay(caseData.countryOfBirth);
    const stageProgress = this.calculateStageProgress(caseData.stages);
    
    return this.adjustForConfidence(
      baseTime + countryDelay + stageProgress
    );
  }
}
```

#### API Layer: Next.js API Routes

```typescript
// RESTful API endpoints
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('id');
  
  if (caseId) {
    return Response.json(await getCaseById(caseId));
  }
  
  return Response.json(await getAllCases());
}

export async function POST(request: Request) {
  const caseData = await request.json();
  const newCase = await createCase(caseData);
  return Response.json(newCase, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('id');
  const updates = await request.json();
  
  const updatedCase = await updateCase(caseId!, updates);
  return Response.json(updatedCase);
}
```

#### Internationalization: React i18next

```typescript
// Bilingual support implementation
const resources = {
  en: {
    translation: {
      'case.timeline': 'Case Timeline',
      'stage.completed': 'Completed',
      'notification.upcoming': 'Upcoming Deadline'
    }
  },
  zh: {
    translation: {
      'case.timeline': '案件时间线',
      'stage.completed': '已完成',
      'notification.upcoming': '即将到期'
    }
  }
};

// Usage in components
const { t, i18n } = useTranslation();
const currentLanguage = i18n.language;
```

---

### 📊 Key Features Demonstrated

#### Case Tracking System
- **10 Comprehensive Stages** - Complete green card process lifecycle
- **Smart Estimation Algorithm** - Historical data analysis with country-specific delays
- **Real-time Updates** - One-click stage completion with automatic recalculation
- **Confidence Assessment** - High/medium/low confidence levels for predictions

#### User Experience
- **Interactive Timeline** - Expandable details and tooltips
- **Smart Alerts** - Filtering (all, unread, important)
- **Document Center** - FAQs and downloadable resources
- **Mobile Responsive** - Adaptive navigation and touch interactions

#### Admin Portal
- **Case Overview** - Stage distribution statistics
- **One-Click Updates** - Automatic estimate recalculation
- **Detailed Management** - Comprehensive case information
- **Notes and Audit Trail** - Administrative tracking

---

### 🚀 Development Process

1. **Project Setup** - Next.js 15 with TypeScript and Tailwind CSS
2. **Internationalization** - Implemented bilingual support with proper typography
3. **Case Tracking** - Built comprehensive 10-stage lifecycle system
4. **Admin Portal** - Developed management interface with analytics
5. **Estimation Engine** - Created AI-powered prediction algorithms
6. **Mobile Optimization** - Responsive design with touch interactions

---

### 📁 Project Structure

```
visa-eligibility-rag/
├── src/app/                  # Next.js app directory
│   ├── api/tracking/        # RESTful API endpoints
│   │   ├── cases/route.ts   # Case CRUD operations
│   │   ├── stages/route.ts  # Stage management
│   │   └── populate/route.ts # Sample data management
│   └── admin/               # Admin portal pages
├── src/components/          # React components
│   ├── Dashboard.tsx        # Main user interface
│   ├── AdminPortal.tsx      # Admin management interface
│   └── [other components]   # Specialized UI components
├── src/types/               # TypeScript definitions
├── src/utils/               # Utility functions
│   └── estimationEngine.ts  # AI prediction algorithms
├── src/data/                # Configuration and sample data
└── package.json             # Dependencies and scripts
```

---

### 🔌 API Documentation

#### Case Management
```http
GET    /api/tracking/cases           # List all cases
POST   /api/tracking/cases           # Create new case
PUT    /api/tracking/cases?id=:id    # Update case
```

#### Stage Management
```http
POST   /api/tracking/stages/complete # Mark stage complete
GET    /api/tracking/stages/updates  # Get recent updates
```

#### Data Management
```http
POST   /api/tracking/populate        # Populate sample data
GET    /api/tracking/populate        # Check data status
```

---

### 📱 Mobile Optimization

- **Responsive Design** - Mobile-first approach with breakpoints at 640px, 1024px
- **Touch Interactions** - Optimized touch targets and gestures
- **Adaptive Navigation** - Tab system becomes dropdown on mobile
- **Typography Scaling** - Appropriate text sizes for different screen sizes
- **Safe Area Support** - Handles device-specific safe areas

---

### 🎯 Portfolio Highlights

#### Why This Project Stands Out
- **Real-World Application** - Solves actual immigration case management challenges
- **Bilingual Implementation** - Demonstrates internationalization expertise
- **AI Integration** - Intelligent estimation engine with confidence levels
- **Full-Stack Development** - Complete Next.js application with API layer
- **Mobile-First Design** - Responsive design with touch optimization
- **Professional Quality** - Production-ready code with comprehensive documentation

#### Technical Achievements
- **Modern Stack** - Next.js 15, TypeScript, Tailwind CSS
- **Internationalization** - Complete English/Chinese support
- **Real-Time Features** - Live updates and synchronization
- **AI Algorithms** - Intelligent prediction and estimation
- **Responsive Design** - Mobile-optimized user experience

---

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ethanzhanghello/visa-eligibility-rag.git
cd visa-eligibility-rag

# Install dependencies
npm install

# Start development server
npm run dev

# Access the system
User Dashboard: http://localhost:3000
Admin Portal: http://localhost:3000/admin
```

---

### 📈 Key Metrics

- **Full-Stack**: Next.js + TypeScript + Tailwind CSS
- **Bilingual**: English/Chinese with proper typography
- **Real-Time**: Live updates and synchronization
- **AI Integration**: Intelligent estimation engine
- **Mobile-First**: Responsive design with touch optimization
- **Professional Quality**: Production-ready code

---

### 🎯 Perfect For

- **Software Engineering Applications**
- **Full-Stack Developer Positions**
- **Frontend Developer Roles**
- **Internationalization Specialist Roles**
- **AI/ML Integration Roles**
- **Technical Interviews**

---

### 📞 Contact

**GitHub:** [ethanzhanghello/visa-eligibility-rag](https://github.com/ethanzhanghello/visa-eligibility-rag)

---

*Built with ❤️ for immigration case management. Demonstrates full-stack development skills with modern web technologies and internationalization expertise.*
