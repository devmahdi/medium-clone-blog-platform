# Contributing to Blog Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/medium-clone-blog-platform.git
   cd medium-clone-blog-platform
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 2. Test Your Changes

```bash
# Lint your code
pnpm lint

# Format your code
pnpm format

# Run tests
pnpm test
```

### 3. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(posts): resolve duplicate post creation bug"
git commit -m "docs(readme): update installation instructions"
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Fill out the PR template
- Submit!

## Pull Request Guidelines

### Before Submitting

- ✅ Code compiles without errors
- ✅ All tests pass
- ✅ Code is properly formatted
- ✅ No console.log statements (use proper logging)
- ✅ Documentation is updated
- ✅ Commits follow conventional commits format

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How did you test this? What scenarios did you cover?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have tested my changes
- [ ] I have updated the documentation
- [ ] My changes don't introduce new warnings
```

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string
  email: string
  username: string
}

async function getUserById(id: string): Promise<User> {
  return await userRepository.findOne({ where: { id } })
}

// ❌ Bad
async function getUser(id) {
  return userRepository.findOne({ where: { id } })
}
```

### React Components

```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  )
}

// ❌ Bad - No types, unclear naming
export function Btn({ l, o, v = 'p' }) {
  return <button onClick={o} className={`btn btn-${v}`}>{l}</button>
}
```

### NestJS Services

```typescript
// ✅ Good - Clear structure, error handling
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async findAll(page: number = 1, limit: number = 10): Promise<Post[]> {
    try {
      return await this.postsRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      })
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch posts')
    }
  }
}

// ❌ Bad - No error handling, magic numbers
@Injectable()
export class PostsService {
  async getPosts() {
    return this.postsRepository.find({ skip: 0, take: 10 })
  }
}
```

## File Naming Conventions

```
Frontend:
- Components: PascalCase (Button.tsx, UserCard.tsx)
- Utilities: camelCase (formatDate.ts, apiClient.ts)
- Pages: lowercase (page.tsx, layout.tsx)

Backend:
- Controllers: kebab-case (users.controller.ts)
- Services: kebab-case (posts.service.ts)
- Entities: kebab-case (user.entity.ts)
- DTOs: kebab-case (create-post.dto.ts)
```

## Testing Guidelines

### Frontend Tests

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button label="Click me" onClick={handleClick} />)
    
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Backend Tests

```typescript
describe('PostsService', () => {
  let service: PostsService
  let repository: Repository<Post>

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<PostsService>(PostsService)
    repository = module.get(getRepositoryToken(Post))
  })

  it('should return all posts', async () => {
    const mockPosts = [{ id: '1', title: 'Test' }]
    jest.spyOn(repository, 'find').mockResolvedValue(mockPosts)

    const result = await service.findAll()
    expect(result).toEqual(mockPosts)
  })
})
```

## Documentation

- Add JSDoc comments for complex functions
- Update README.md for new features
- Add examples for new APIs
- Keep ARCHITECTURE.md in sync with changes

## Need Help?

- Check existing issues and PRs
- Ask questions in discussions
- Reach out to maintainers

## Recognition

Contributors will be added to the README.md contributors section.

Thank you for contributing! 🎉
