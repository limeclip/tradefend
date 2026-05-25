# Настройка GoPlus Security API

GoPlus используется для **Deployer Reputation** на публичных страницах `/token/[address]`: адрес деплоера, флаги контракта (mint, freeze, renounce), теги honeypot / rug pull.

## Шаг 1. Регистрация

1. Откройте [console.gopluslabs.io](https://console.gopluslabs.io).
2. Зарегистрируйтесь или войдите в аккаунт.
3. Создайте приложение (App) в консоли, если интерфейс это запрашивает.

## Шаг 2. Получение API Key

1. В консоли GoPlus найдите раздел **API Key** / **Credentials** (название может отличаться).
2. Скопируйте **API Key** (иногда отображается как Access Token / App Key для Bearer-авторизации).

## Шаг 3. Добавление в проект

1. В корне репозитория создайте или откройте файл `.env.local` (не коммитьте его в git).
2. Добавьте строку:

```env
GOPLUS_API_KEY=ваш_ключ_из_консоли
```

3. Сохраните файл.

## Шаг 4. Перезапуск Next.js

Остановите dev-сервер (`Ctrl+C`) и снова запустите:

```bash
npm run dev
```

Переменные из `.env.local` подхватываются только после перезапуска.

## Проверка

1. Откройте публичную страницу EVM-токена, например:
   `http://localhost:3000/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chain=ethereum`
2. Блок **Deployer reputation** должен показать адрес деплоера и флаги, а не сообщение про отсутствие ключа.

## Если ключ не задан

На странице отображается:

> GoPlus API key missing. Configure it in `.env.local`

и ссылка на эту инструкцию.

## Поддерживаемые сети

GoPlus Token Security API работает для EVM-сетей (Ethereum, BSC, Polygon, Arbitrum, Base и др.). Для Solana mint-адресов блок Deployer Reputation может быть недоступен — это ожидаемо.

## См. также

- [etherscan-setup.md](./etherscan-setup.md) — история контрактов деплоера (Etherscan / BscScan).
