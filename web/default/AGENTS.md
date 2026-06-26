
# 

 AI  `package.json` 

---

## 

### 

|      |  |
|----------|------|
|    | Bun |
|      | React 19TypeScript |
|  | @tanstack/react-queryaxiosZustand |
|      | @tanstack/react-router |
|  | @tanstack/react-table@tanstack/react-virtual |
|    | i18nextreact-i18nexti18next-browser-languagedetector |
|      | Day.js |
| UI  | Base UIHugeiconsTailwind CSSclsx / class-variance-authority |
|      | React Hook FormZod |
|      | @visactor/vchart@visactor/react-vchart |
|      | qrcode.reactoxfmtoxlintvitest|



---

## 

- [](#)
- [](#)
- [](#)
  - [3.1 ](#31-)
  - [3.2 ](#32-)
  - [3.3 ](#33-)
  - [3.4 ](#34-)
  - [3.5 ](#35-)
  - [3.6 API ](#36-api-)
  - [3.7 ](#37-)
  - [3.8 ](#38-)
  - [3.9 ](#39-)
  - [3.10 ](#310-)
  - [3.11 ](#311-)
  - [3.12 ](#312-)
  - [3.13 ](#313-)
  - [3.14 ](#314-)
  - [3.15 ](#315-)
  - [3.16 ](#316-)
- [](#)
- [](#)

---

## 

### 3.1 

- **** i18n `useTranslation()`  `t()` 
- ****  
  - **React ** `const { t } = useTranslation()`  
  - ** React ** `import { t } from 'i18next'`  
  -  `useTranslation()`
- **** APIReactTypeScript
- **** `dashboard.overview.title`

- ** i18n**  
   feature  `constants.ts` / + / i18n  
  - **//** `SUCCESS_MESSAGES``ERROR_MESSAGES` **i18n ** fallback **** `t()`  `toast.success(t(SUCCESS_MESSAGES.API_KEY_CREATED))``toast.error(t(ERROR_MESSAGES.UNEXPECTED))`**** `toast.success(SUCCESS_MESSAGES.xxx)`   
  - **/ label** **labelKey** i18n  `t(config.labelKey)`  `label`  en  key  `t(config.label)` feature   
  - **** `src/i18n/static-keys.ts`  key `t('...')` 

### 3.2 

- **** 2  `if-else`
- ****
- **TypeScript** `any` `unknown` `import type { X } from '...'`
- **** TypeScript  TSX  `bun run typecheck`
- **Lint ** lint  lint error errorwarning 
- **** props `props.xxx` 

### 3.3 

-  Hooks props 
- **Props ** props  `props.xxx`  [3.2 ](#32-)
-  200  Hooks `types` 

### 3.4 

- **React** `useMemo``useCallback` / `React.memo`
- **** `React.lazy`  `import` 
- **** @tanstack/react-virtual

### 3.5 

-  Zustand  `create`  store state  actions 
-  store `const user = useAuthStore((s) => s.auth.user)`
-  store  localStorage
- Store  `src/stores/`

### 3.6 API 

- **React Query** `useQuery` `useMutation` `queryKey` `onSuccess`  query  `invalidateQueries` `handleServerError`  [3.9 ](#39-)
- **Axios** `api`  `baseURL``headers``withCredentials: true`GET 

### 3.7 

-  React Hook Form + Zod `lib/`  schema `z.infer` `useForm`  `@hookform/resolvers/zod` 
-  `onSubmit` [3.9 ](#39-)

### 3.8 

-  TanStack Router `src/routes/` `createFileRoute`  Zod schema + `validateSearch` 
-  `beforeLoad`  `_authenticated`  `<Outlet />` 
-  `useNavigate`  `Link` `window.location`

### 3.9 

- **** `handleServerError` React Query  HTTP  i18n
- **** `toast.error`  `errorComponent` 
- **** `form.setError` 

### 3.10 

-  Tailwind  `cn()` 
-  Tailwind `sm:``md:``lg:`  CSS  `dark:` `src/styles/` CSS

### 3.11 

- **** `src/features/<feature>/` `components/``lib/``hooks/` `api.ts``types.ts``constants.ts`
- **** `src/components/` `src/lib/` PascalCase/ kebab-case  `types.ts` PascalCase  `export type`

### 3.12 

-  HTML `header``nav``main``footer` `label` 
-  ARIA `aria-label``aria-expanded``aria-hidden` `aria-hidden="true"`
-  WCAG 2.1 AA 4.5:1

### 3.13 

- 
-  Zod
-  React  `dangerouslySetInnerHTML` Cookie  `withCredentials`  CSRF

### 3.14 

- Vitest `*.test.ts` React Testing Library 
-  E2E MSW  APIPlaywright/Cypress 80% 
-  API  smokesleep/timing
-  Vitest  React Testing Library  helper
- 

### 3.15 

-  **Bun**`bun install``bun add <pkg>``bun add -d <pkg>``bun remove <pkg>``bun pm ls``bun update` 
-  `^`/`~` 

### 3.16 

-  Rsbuild `rsbuild.config.ts` `package.json`  `bun run dev``bun run build``bun run typecheck``bun run lint``bun run format` [3.15 ](#315-)
-  [3.4 ](#34-) `.env`  `VITE_` 
- **** typechecklintformat 

---

## 

- 
- 
-  `AGENTS.md`

---

## 

- **2026-01-28**
- **2026-01-28**API
- **2026-01-29**
- **2026-01-31** 3.2  TS/TSX  typecheck 
- **2026-06-21** 3.2 Lint  lint error
