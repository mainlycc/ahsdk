# Chat AI - Asystent z analizą PDF i obrazów

Aplikacja Next.js z funkcjonalnością chat AI, analizy plików PDF i opisywania obrazów. Aplikacja wykorzystuje OpenAI GPT-4o do rozmów i Google Gemini 1.5 Flash do analizy dokumentów PDF.

## 🚀 Funkcjonalności

- **Chat AI** - Rozmowa z asystentem AI (OpenAI GPT-4o)
- **Analiza PDF** - Przesyłanie i analiza dokumentów PDF (Google Gemini)
- **Opisywanie obrazów** - Analiza i opisywanie przesłanych obrazów
- **System autoryzacji** - Logowanie i zarządzanie użytkownikami
- **Responsywny design** - Dostosowany do urządzeń mobilnych i desktop
- **Ciemny motyw** - Wbudowany system motywów

## 📋 Wymagania

- Node.js 18+ 
- pnpm (zalecane) lub npm/yarn
- Klucze API:
  - OpenAI API Key (dla chat AI)
  - Google Generative AI API Key (dla analizy PDF)

## 🛠️ Instalacja i konfiguracja

### 1. Sklonuj repozytorium

```bash
git clone <url-repozytorium>
cd my
```

### 2. Zainstaluj zależności

```bash
pnpm install
# lub
npm install
# lub
yarn install
```

### 3. Skonfiguruj zmienne środowiskowe

Utwórz plik `.env.local` w głównym katalogu projektu:

```env
# OpenAI API (wymagane dla chat AI)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google AI API (wymagane dla analizy PDF)
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key-here
# lub alternatywnie:
# GOOGLE_API_KEY=your-google-api-key-here
# GEMINI_API_KEY=your-google-api-key-here
```

### 4. Uruchom aplikację w trybie deweloperskim

```bash
pnpm dev
# lub
npm run dev
# lub
yarn dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

## 🔧 Uzyskiwanie kluczy API

### OpenAI API Key
1. Przejdź na [platform.openai.com](https://platform.openai.com)
2. Zaloguj się lub utwórz konto
3. Przejdź do sekcji "API Keys"
4. Utwórz nowy klucz API
5. Skopiuj klucz i dodaj do `.env.local`

### Google Generative AI API Key
1. Przejdź na [makersuite.google.com](https://makersuite.google.com)
2. Zaloguj się kontem Google
3. Przejdź do sekcji "Get API Key"
4. Utwórz nowy klucz API
5. Skopiuj klucz i dodaj do `.env.local`

## 📱 Użytkowanie

1. **Logowanie** - Po uruchomieniu aplikacji zostaniesz przekierowany do strony logowania
2. **Chat** - Główna strona zawiera panel czatu z asystentem AI
3. **Analiza PDF** - Przeciągnij plik PDF do obszaru czatu lub użyj przycisku załącznika
4. **Obrazy** - Prześlij obraz, aby AI go opisał
5. **Profil** - Dostęp do ustawień użytkownika w prawym panelu (desktop)

## 🏗️ Budowanie dla produkcji

```bash
pnpm build
pnpm start
```

## 📁 Struktura projektu

```
src/
├── app/                    # Strony Next.js
│   ├── api/               # API routes
│   │   ├── chat/          # Chat AI endpoint
│   │   └── analyze-pdf/   # PDF analysis endpoint
│   ├── login/             # Strona logowania
│   └── profile/           # Strona profilu
├── components/            # Komponenty React
│   ├── ai-elements/       # Komponenty AI
│   ├── ui/               # Komponenty UI (shadcn/ui)
│   └── ...               # Inne komponenty
├── hooks/                # Custom React hooks
└── lib/                  # Utilities i schematy
```

## 🐛 Rozwiązywanie problemów

### Błąd "Brak klucza OpenAI API"
- Sprawdź czy plik `.env.local` istnieje
- Upewnij się, że klucz API jest poprawny
- Restart serwera deweloperskiego

### Błąd "Brak klucza Google AI API"
- Sprawdź czy klucz Google API jest ustawiony
- Upewnij się, że API jest włączone w Google Cloud Console

### Problemy z analizą PDF
- Sprawdź czy plik PDF nie jest uszkodzony
- Upewnij się, że plik nie przekracza limitu rozmiaru
- Sprawdź czy Google AI API ma odpowiednie uprawnienia



Dlaczego Next.js zamiast Expo Router?

Projekt został zbudowany w Next.js, ponieważ ta technologia pozwala tworzyć jednocześnie aplikację webową i jej mobilną wersję responsywną, dostępną bezpośrednio z poziomu przeglądarki na telefonie. Dzięki temu użytkownicy nie muszą instalować dodatkowej aplikacji ze sklepu – wystarczy wejść na stronę, aby korzystać z pełnej funkcjonalności.

Rozwiązanie oparte na Next.js jest także łatwe w dalszym rozwoju. Możemy w prosty sposób dodawać nowe funkcje, takie jak np. sterowanie głosem czy gestami głowy, bez konieczności budowania całkowicie oddzielnej aplikacji mobilnej.

Warto podkreślić, że w razie potrzeby ten sam projekt można zaadaptować do Expo Router i stworzyć pełnoprawną aplikację mobilną na Androida i iOS, jeśli wymagania biznesowe lub użytkowe będą tego potrzebować.