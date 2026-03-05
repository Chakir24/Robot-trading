# Déploiement sur GitHub

## 1. Créer le dépôt sur GitHub

1. Allez sur [github.com/new](https://github.com/new)
2. Nom du dépôt : `trad3` (ou autre)
3. Choisissez **Public**
4. Ne cochez pas "Add a README" (le projet en a déjà un)
5. Cliquez sur **Create repository**

## 2. Pousser le code

Dans le terminal, à la racine du projet :

```bash
cd /home/tatsuya/Desktop/Project/trad3

# Ajouter le remote (remplacez VOTRE_UTILISATEUR par votre nom GitHub)
git remote add origin https://github.com/VOTRE_UTILISATEUR/trad3.git

# Pousser
git push -u origin main
```

Si vous utilisez SSH :
```bash
git remote add origin git@github.com:VOTRE_UTILISATEUR/trad3.git
git push -u origin main
```

## 3. Déployer sur Vercel

Le projet est configuré pour Vercel. Correctifs appliqués :

- **Stockage** : `/tmp` utilisé sur Vercel (filesystem read-only)
- **Fetch** : `cache: "no-store"` pour éviter les erreurs serverless
- **Timeout** : `maxDuration: 30` pour les API routes

**Déploiement** :

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec GitHub
2. **Add New Project** → importez le dépôt `Robot-trading` (ou `trad3`)
3. Vercel détecte Next.js → **Deploy**
4. Site en ligne : `https://votre-projet.vercel.app`

**Limitation Vercel** : L'évaluation TP/SL est stockée dans `/tmp` (éphémère). Les données ne persistent pas entre les cold starts. Pour une évaluation 24/7 persistante, hébergez sur un VPS (Railway, Render, ou serveur dédié).

## 4. Alternative : GitHub Pages

GitHub Pages ne supporte pas les API routes Next.js. Pour un site statique uniquement, il faudrait désactiver les API et l'évaluation serveur. **Vercel est recommandé** pour ce projet.
