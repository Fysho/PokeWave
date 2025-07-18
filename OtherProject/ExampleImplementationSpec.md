# InSpades Task Manager - Implementation Specification

## Executive Summary

This document provides a comprehensive implementation specification for the InSpades Task Manager, a lightweight task management system designed for a 12-person Unity game development team. The system prioritizes simplicity, ease of use, and core functionality over enterprise features.

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [Database Schema](#database-schema)
3. [API Specification](#api-specification)
4. [Frontend Components](#frontend-components)
5. [Authentication Flow](#authentication-flow)
6. [Implementation Phases](#implementation-phases)
7. [Development Guidelines](#development-guidelines)
8. [Deployment Instructions](#deployment-instructions)

## Technical Architecture

### Technology Stack

```yaml
Frontend:
  - Framework: React 18.x with TypeScript
  - State Management: Zustand (lightweight alternative to Redux)
  - UI Library: Mantine UI (modern, accessible, built-in dark mode)
  - Build Tool: Vite
  - Styling: CSS Modules + Mantine themes
  - Gantt Chart: Frappe Gantt (lightweight, customizable)
  - HTTP Client: Axios
  - Date Handling: date-fns

Backend:
  - Runtime: Node.js 18.x LTS
  - Framework: Express.js with TypeScript
  - Database: PostgreSQL 14.x
  - ORM: Prisma (type-safe, auto-migrations)
  - API Style: RESTful JSON API
  - Authentication: Passport.js with Google OAuth 2.0
  - Session: express-session with connect-pg-simple
  - Validation: Zod
  - Logging: Winston

Development:
  - Version Control: Git
  - Package Manager: npm
  - Code Quality: ESLint + Prettier
  - TypeScript: Standard configuration
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Pages        │  Components     │  Services    │  Store      │
│  ├─ Dashboard │  ├─ TaskCard    │  ├─ api.ts   │  ├─ auth    │
│  ├─ Tasks     │  ├─ GanttChart  │  ├─ auth.ts  │  ├─ tasks   │
│  ├─ Timeline  │  ├─ TaskForm    │  └─ utils.ts │  └─ devs    │
│  └─ Login     │  └─ Comments    │              │             │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP/JSON
                               │
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Express)                     │
├─────────────────────────────────────────────────────────────┤
│  Routes       │  Controllers    │  Services    │  Middleware │
│  ├─ auth      │  ├─ authCtrl    │  ├─ taskSvc  │  ├─ auth    │
│  ├─ tasks     │  ├─ taskCtrl    │  ├─ devSvc   │  ├─ error   │
│  ├─ devs      │  ├─ devCtrl     │  └─ depSvc   │  └─ logger  │
│  └─ comments  │  └─ commentCtrl │              │             │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ Prisma ORM
                               │
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
inspades-task-manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── tasks/
│   │   │   ├── timeline/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   └── types/
├── docs/
├── scripts/
└── README.md
```

## Database Schema

### Prisma Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  googleId      String    @unique
  name          String
  role          UserRole  @default(DEVELOPER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  developer     Developer?
  comments      Comment[]
  activities    ActivityLog[]
  tasksCreated  Task[]    @relation("TaskCreator")
}

enum UserRole {
  ADMIN
  DEVELOPER
  VIEWER
}

model Developer {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  specialization  String
  color           String    // Hex color for Gantt chart
  active          Boolean   @default(true)
  contactInfo     String?
  
  tasks           TaskAssignment[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Task {
  id                  String    @id @default(cuid())
  name                String
  description         String?   // Rich text as HTML
  category            TaskCategory
  timeAllocation      Int       // Days
  startDate           DateTime
  dueDate             DateTime
  completionPercentage Int      @default(0)
  status              TaskStatus @default(NOT_STARTED)
  createdById         String
  createdBy           User      @relation("TaskCreator", fields: [createdById], references: [id])
  orderIndex          Int       @default(0) // For drag-drop ordering
  
  assignments         TaskAssignment[]
  dependencies        TaskDependency[] @relation("DependentTask")
  dependents          TaskDependency[] @relation("DependsOnTask")
  comments            Comment[]
  activities          ActivityLog[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime? // Soft delete
  
  @@index([status])
  @@index([category])
  @@index([startDate, dueDate])
}

enum TaskCategory {
  PROGRAMMING
  LEVEL_DESIGN
  GAME_DESIGN
  UI_UX
  MODELING_3D
  AUDIO
  OTHER
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
  ON_HOLD
}

model TaskAssignment {
  taskId      String
  developerId String
  task        Task      @relation(fields: [taskId], references: [id])
  developer   Developer @relation(fields: [developerId], references: [id])
  assignedAt  DateTime  @default(now())
  
  @@id([taskId, developerId])
}

model TaskDependency {
  id              String           @id @default(cuid())
  taskId          String
  dependsOnTaskId String
  type            DependencyType   @default(FINISH_TO_START)
  
  task            Task    @relation("DependentTask", fields: [taskId], references: [id])
  dependsOnTask   Task    @relation("DependsOnTask", fields: [dependsOnTaskId], references: [id])
  
  createdAt       DateTime @default(now())
  
  @@unique([taskId, dependsOnTaskId])
}

enum DependencyType {
  FINISH_TO_START
  START_TO_START
  FINISH_TO_FINISH
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  task      Task     @relation(fields: [taskId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([taskId])
}

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // e.g., "created_task", "updated_status"
  entityType  String   // e.g., "task", "comment"
  entityId    String
  metadata    Json?    // Additional context
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id])
  
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([entityType, entityId])
}

model Session {
  id        String   @id
  sid       String   @unique
  sess      Json
  expire    DateTime
  
  @@index([expire])
}
```

## API Specification

### Authentication Endpoints

```typescript
// POST /api/auth/google
// Initiates Google OAuth flow
// Response: Redirect to Google

// GET /api/auth/google/callback
// Google OAuth callback
// Response: Redirect to frontend with session

// GET /api/auth/me
// Get current user info
interface AuthMeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    developer?: {
      id: string;
      specialization: string;
      color: string;
    };
  };
}

// POST /api/auth/logout
// Logout current user
// Response: 200 OK
```

### Task Endpoints

```typescript
// GET /api/tasks
// Query params: ?status=IN_PROGRESS&category=PROGRAMMING&developerId=xxx
interface GetTasksResponse {
  tasks: Task[];
  total: number;
}

// GET /api/tasks/:id
interface GetTaskResponse {
  task: TaskWithRelations;
}

// POST /api/tasks
interface CreateTaskRequest {
  name: string;
  description?: string;
  category: TaskCategory;
  timeAllocation: number;
  startDate: string; // ISO date
  dueDate: string;
  assignedDeveloperIds: string[];
  dependsOnTaskIds?: string[];
}

// PUT /api/tasks/:id
interface UpdateTaskRequest {
  name?: string;
  description?: string;
  status?: TaskStatus;
  completionPercentage?: number;
  // ... other fields
}

// DELETE /api/tasks/:id
// Soft delete

// POST /api/tasks/reorder
interface ReorderTasksRequest {
  taskOrders: Array<{
    taskId: string;
    orderIndex: number;
  }>;
}

// GET /api/tasks/:id/dependencies
interface GetDependenciesResponse {
  dependencies: TaskDependency[];
  dependents: TaskDependency[];
}
```

### Developer Endpoints

```typescript
// GET /api/developers
interface GetDevelopersResponse {
  developers: Developer[];
}

// GET /api/developers/:id/tasks
interface GetDeveloperTasksResponse {
  tasks: Task[];
  workload: {
    totalTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    totalDays: number;
  };
}

// PUT /api/developers/:id
interface UpdateDeveloperRequest {
  specialization?: string;
  color?: string;
  active?: boolean;
  contactInfo?: string;
}
```

### Timeline Endpoints

```typescript
// GET /api/timeline
// Query params: ?startDate=2024-01-01&endDate=2024-12-31&developerIds=id1,id2
interface GetTimelineResponse {
  tasks: Array<{
    id: string;
    name: string;
    startDate: string;
    dueDate: string;
    completionPercentage: number;
    developers: Array<{
      id: string;
      name: string;
      color: string;
    }>;
    dependencies: string[]; // Task IDs
  }>;
}
```

### Comment Endpoints

```typescript
// GET /api/tasks/:taskId/comments
interface GetCommentsResponse {
  comments: Comment[];
}

// POST /api/tasks/:taskId/comments
interface CreateCommentRequest {
  content: string;
}

// PUT /api/comments/:id
interface UpdateCommentRequest {
  content: string;
}

// DELETE /api/comments/:id
```

## Frontend Components

### Core Components Structure

```typescript
// components/tasks/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  isDragging?: boolean;
}

// components/tasks/TaskForm.tsx
interface TaskFormProps {
  task?: Task; // For editing
  developers: Developer[];
  tasks: Task[]; // For dependency selection
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

// components/timeline/GanttChart.tsx
interface GanttChartProps {
  tasks: TimelineTask[];
  developers: Developer[];
  startDate: Date;
  endDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onTaskClick: (taskId: string) => void;
  filters: {
    developerIds?: string[];
    categories?: TaskCategory[];
    statuses?: TaskStatus[];
  };
}

// components/common/ThemeToggle.tsx
// Dark/Light mode toggle using Mantine's color scheme

// components/layout/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
}
// Includes navigation, header, theme toggle
```

### State Management (Zustand)

```typescript
// store/authStore.ts
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// store/taskStore.ts
interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
}

// store/developerStore.ts
interface DeveloperStore {
  developers: Developer[];
  fetchDevelopers: () => Promise<void>;
  updateDeveloper: (id: string, data: UpdateDeveloperData) => Promise<void>;
}
```

### Page Components

```typescript
// pages/Dashboard.tsx
// - Summary statistics
// - Recent activities
// - Quick actions
// - Task status overview

// pages/Tasks.tsx
// - Task list with filters
// - Create/Edit task modal
// - Bulk actions
// - Search functionality

// pages/Timeline.tsx
// - Gantt chart view
// - Filter sidebar
// - View mode selector
// - Timeline controls

// pages/Login.tsx
// - Google OAuth login button
// - App branding
```

## Authentication Flow

### Google OAuth Implementation

```typescript
// backend/src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });
    
    // Create new user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          role: 'DEVELOPER' // Default role
        }
      });
      
      // Create developer profile
      await prisma.developer.create({
        data: {
          userId: user.id,
          specialization: 'General',
          color: generateRandomColor()
        }
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Session configuration
app.use(session({
  store: new PgSession({
    pool: pgPool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
```

### Frontend Auth Guard

```typescript
// components/common/AuthGuard.tsx
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : null;
};
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize monorepo structure
   - Configure TypeScript, ESLint, Prettier
   - Set up Git repository
   - Create initial README and documentation

2. **Database Setup**
   - Install and configure PostgreSQL
   - Create Prisma schema
   - Run initial migrations
   - Seed with test data

3. **Backend Foundation**
   - Express server setup with TypeScript
   - Configure middleware (cors, body-parser, session)
   - Implement error handling
   - Set up logging with Winston

4. **Authentication**
   - Configure Google OAuth
   - Implement session management
   - Create auth endpoints
   - Add auth middleware

### Phase 2: Core Backend (Week 3-4)
1. **Task Management API**
   - CRUD endpoints for tasks
   - Task assignment logic
   - Reordering functionality
   - Filtering and search

2. **Developer Management**
   - Developer endpoints
   - Workload calculations
   - Color management

3. **Dependency System**
   - Dependency CRUD operations
   - Circular dependency validation
   - Critical path calculation

4. **Data Validation**
   - Zod schemas for all endpoints
   - Request validation middleware
   - Error response standardization

### Phase 3: Frontend Foundation (Week 5-6)
1. **React Setup**
   - Vite configuration
   - Mantine UI setup
   - Routing configuration
   - Theme setup (dark/light mode)

2. **Authentication UI**
   - Login page
   - Auth state management
   - Protected routes
   - User profile display

3. **Layout Components**
   - Navigation menu
   - Header with user info
   - Theme toggle
   - Responsive layout

4. **State Management**
   - Zustand store setup
   - API service layer
   - Error handling

### Phase 4: Task Management UI (Week 7-8)
1. **Task List View**
   - Task cards with status
   - Filter sidebar
   - Search functionality
   - Pagination

2. **Task CRUD**
   - Create task modal
   - Edit task form
   - Delete confirmation
   - Drag-drop reordering

3. **Task Details**
   - Full task view
   - Status updates
   - Progress tracking
   - Assignment management

4. **Bulk Operations**
   - Multi-select
   - Bulk status change
   - Bulk assignment

### Phase 5: Timeline & Gantt (Week 9-10)
1. **Gantt Chart Integration**
   - Frappe Gantt setup
   - Custom styling
   - Event handlers
   - Responsive behavior

2. **Timeline Features**
   - Date range controls
   - View mode toggle
   - Today indicator
   - Zoom controls

3. **Filtering**
   - Developer toggle
   - Category filter
   - Status filter
   - Date range picker

4. **Dependency Visualization**
   - Dependency lines
   - Critical path highlight
   - Blocked task indicators

### Phase 6: Collaboration (Week 11)
1. **Comments System**
   - Comment thread UI
   - Add/edit/delete comments
   - Real-time updates
   - @mention display

2. **Activity Log**
   - Activity feed component
   - Filter by user/action
   - Timestamp display
   - Pagination

3. **Notifications**
   - In-app notifications
   - Notification preferences
   - Mark as read

### Phase 7: Polish & Deploy (Week 12)
1. **UI/UX Polish**
   - Loading states
   - Error boundaries
   - Empty states
   - Tooltips and help

2. **Performance**
   - Code splitting
   - Lazy loading
   - Query optimization
   - Caching strategy

3. **Deployment Prep**
   - Environment configuration
   - Build optimization
   - Deployment scripts
   - Documentation

4. **Testing & QA**
   - Manual testing
   - Bug fixes
   - Performance testing
   - User acceptance

## Development Guidelines

### Code Standards

```typescript
// Consistent naming conventions:
// - PascalCase for components and types
// - camelCase for functions and variables
// - SCREAMING_SNAKE_CASE for constants

// Example component structure:
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  // Component logic
  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
};

// API error handling pattern:
export const createTask = async (data: CreateTaskData): Promise<Task> => {
  try {
    const response = await api.post('/tasks', data);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to create task');
  }
};
```

### Git Workflow

```bash
# Branch naming
feature/task-drag-drop
bugfix/gantt-chart-rendering
refactor/api-structure

# Commit message format
feat: Add task drag and drop functionality
fix: Resolve Gantt chart rendering issue
refactor: Restructure API controllers
docs: Update deployment instructions
```

### Environment Variables

```bash
# backend/.env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/inspades_tasks
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# frontend/.env
VITE_API_URL=http://localhost:3001/api
```

## Deployment Instructions

For detailed setup instructions for development environments and deployment, please refer to [Installation.md](./Installation.md).

### Prerequisites

1. **Server Requirements**
   - Node.js 18.x LTS
   - PostgreSQL 14.x
   - Git
   - PM2 (for process management)
   - Nginx (for reverse proxy)

2. **Domain & SSL**
   - Internal domain configured
   - SSL certificate (self-signed for internal use)

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'inspades-backend',
      script: './backend/dist/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'inspades-frontend',
      script: 'serve',
      args: '-s frontend/dist -l 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name tasks.inspades.local;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### Backup Strategy

```bash
# Daily backup script (cron)
#!/bin/bash
BACKUP_DIR="/backups/inspades-tasks"
DATE=$(date +%Y%m%d)

# Database backup
pg_dump inspades_tasks > "$BACKUP_DIR/db_$DATE.sql"

# Keep last 30 days
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete
```

## Additional Implementation Notes

### Performance Considerations

1. **Database Indexing**
   - Indexes on frequently queried fields (status, dates)
   - Composite indexes for complex queries
   - Regular VACUUM and ANALYZE

2. **Frontend Optimization**
   - Virtual scrolling for large task lists
   - Debounced search inputs
   - Memoized components
   - Lazy load timeline view

3. **Caching Strategy**
   - Cache developer list (rarely changes)
   - Short TTL for task data
   - Invalidate on mutations

### Security Considerations

1. **Authentication**
   - Only allow specific Google Workspace domain
   - Session timeout after inactivity
   - CSRF protection

2. **Authorization**
   - Role-based access control
   - Validate user permissions on backend
   - Sanitize user inputs

3. **Data Protection**
   - HTTPS only
   - Secure session cookies
   - No sensitive data in logs

### Monitoring & Maintenance

1. **Logging**
   - Application logs with Winston
   - Access logs with Nginx
   - Error tracking

2. **Health Checks**
   - Database connection monitoring
   - API endpoint health check
   - Disk space monitoring

3. **Updates**
   - Monthly dependency updates
   - Security patch monitoring
   - Database backup verification

## Conclusion

This implementation specification provides a comprehensive guide for building the InSpades Task Manager. The system is designed to be simple, maintainable, and focused on the core needs of a small game development team. The phased approach allows for iterative development with regular milestones and deliverables.

Key success factors:
- Keep it simple - avoid over-engineering
- Focus on usability over features
- Ensure reliable performance
- Maintain clear documentation
- Plan for easy maintenance

The estimated timeline of 12 weeks provides buffer for unexpected challenges while maintaining steady progress toward a functional task management system.