# Internationalization (i18n) System

This project uses React i18next for internationalization support. Currently supports English and French languages.

## How it works

1. **Language Context**: The `LanguageContext` provides language state and translation functions throughout the app
2. **Translation Files**: Located in `locales/` directory with JSON files for each language
3. **Automatic Detection**: Language is detected from localStorage, browser settings, or defaults to English
4. **Real-time Switching**: Language can be changed in Settings and updates immediately across the app

## Usage

### In Components

```tsx
import { useLanguage } from "../contexts/LanguageContext";

function MyComponent() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <h1>{t("common.title")}</h1>
      <button onClick={() => setLanguage("fr")}>Switch to French</button>
    </div>
  );
}
```

### Translation Keys

Translation keys are organized hierarchically:

- `common.*` - Common UI elements (buttons, labels, etc.)
- `navigation.*` - Navigation menu items
- `dashboard.*` - Dashboard page content
- `tasks.*` - Tasks page content
- `appointments.*` - Appointments page content
- `finance.*` - Finance page content
- `notifications.*` - Notifications page content
- `settings.*` - Settings page content
- `auth.*` - Authentication pages content
- `home.*` - Home page content

### Adding New Translations

1. Add the key to both `en.json` and `fr.json` files
2. Use the key in your component with `t('key.path')`
3. The translation will automatically update when language changes

## Current Status

- ✅ English translations (complete)
- ✅ French translations (complete)
- ✅ Language switching in Settings
- ✅ Sidebar navigation translated
- ✅ Settings page partially translated
- 🔄 Other pages (in progress)

## Testing

1. Go to Settings page
2. Change language from "English" to "Français"
3. Observe that the interface updates to French
4. Navigate to different pages to see translated content
