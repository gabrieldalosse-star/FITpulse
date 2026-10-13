# FITpulse

Aplicativo estático para organizar treino, dieta, recuperação e produtividade. Os dados ficam no navegador por padrão; a sincronização com Firestore é opcional.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie o conteúdo desta pasta.
2. No repositório, abra **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação.
3. Faça push para a branch `main`. O fluxo em `.github/workflows/deploy-pages.yml` publica a pasta `dist` automaticamente.

## Ativar Firebase (opcional)

1. Crie um projeto no Firebase e adicione um app Web.
2. Em **Authentication → Sign-in method**, habilite o provedor **Google**.
3. Em **Authentication → Settings → Authorized domains**, inclua o domínio do GitHub Pages (por exemplo, `seu-usuario.github.io`).
4. Em **Firestore Database**, crie o banco em modo produção.
5. Copie a configuração Web para `dist/firebase-config.js`.
6. Troque `SEU_FIREBASE_PROJECT_ID` em `.firebaserc` pelo ID real do projeto.
7. Instale a CLI do Firebase, autentique-se e execute:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,hosting
   ```

As regras em `firestore.rules` aceitam apenas sessões autenticadas pelo Google e permitem que cada usuário leia e grave apenas o seu próprio documento. Não use regras abertas como `allow read, write: if true`.

## Estrutura

- `dist/`: app pronto para GitHub Pages ou Firebase Hosting.
- `firebase-config.js`: configuração opcional do Firebase.
- `firestore.rules`: proteção dos dados por usuário.
- `.github/workflows/deploy-pages.yml`: publicação automática no GitHub Pages.
