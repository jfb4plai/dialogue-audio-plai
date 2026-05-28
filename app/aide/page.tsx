import Link from 'next/link'

export default function AidePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-jfb-gris hover:text-jfb-noir transition-colors">
          ← Retour à l&apos;accueil
        </Link>
      </div>
      <h1 className="text-xl font-bold text-jfb-noir mb-1">Premiers pas</h1>
      <p className="text-jfb-gris text-sm mb-8">Dialogue Audio — PLAI FWB</p>

      <div className="space-y-10">

        {/* Intro — tout en un, sans inscription */}
        <section>
          <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
            <p className="text-sm font-semibold text-jfb-noir mb-3">Un outil complet, sans inscription</p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Sans compte', 'Sans installation', 'Sans coût pour l\'enseignant', 'Navigateur suffit'].map(chip => (
                <span key={chip} className="text-[11px] font-medium text-jfb-noir bg-jfb-subtil border border-jfb-bordure px-2.5 py-1" style={{ borderRadius: '2px' }}>
                  ✓ {chip}
                </span>
              ))}
            </div>

            <p className="text-sm text-jfb-gris leading-relaxed mb-4">
              Dialogue Audio génère un enregistrement audio de conversation entre plusieurs personnages,
              dans la langue de votre choix, avec le sujet que vous définissez.
              Tout se fait en quelques clics — l&apos;IA rédige le texte et produit le son.
            </p>

            <p className="text-xs font-semibold text-jfb-noir mb-2">En un seul outil, vous obtenez :</p>
            <ul className="space-y-1.5 text-xs text-jfb-gris">
              <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span>Un <strong className="text-jfb-noir">fichier audio MP3</strong> en voix synthétisées (2 à 4 personnages)</span></li>
              <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span>Un <strong className="text-jfb-noir">QR code</strong> à projeter ou imprimer — les élèves écoutent avec leur smartphone, sans rien installer</span></li>
              <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span>Des <strong className="text-jfb-noir">exercices générés automatiquement</strong> : questions vrai/faux, texte à trous, lexique du dialogue</span></li>
              <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span>Des <strong className="text-jfb-noir">cartes flash</strong> exportables vers{' '}
                <a href="https://portail-plai.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="underline text-jfb-rose hover:text-jfb-noir transition-colors">FlashPLAI</a>
                {' '}pour la mémorisation du vocabulaire</span></li>
            </ul>
          </div>
        </section>

        {/* RGPD — avant les 4 étapes */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Données et confidentialité</h2>
          <div className="bg-white border border-jfb-bordure p-4 space-y-2" style={{ borderRadius: '2px' }}>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-sm flex-shrink-0 mt-0.5">✓</span>
              <p className="text-xs text-jfb-gris"><strong className="text-jfb-noir">Aucun compte à créer.</strong> L&apos;outil fonctionne sans inscription, sans email, sans mot de passe.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-sm flex-shrink-0 mt-0.5">✓</span>
              <p className="text-xs text-jfb-gris"><strong className="text-jfb-noir">Aucune donnée personnelle collectée.</strong> Vos textes et vos paramètres ne sont pas conservés après votre session.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-amber-500 font-bold text-sm flex-shrink-0 mt-0.5">!</span>
              <p className="text-xs text-jfb-gris"><strong className="text-jfb-noir">Les fichiers audio générés sont publics.</strong> Toute personne disposant du lien ou du QR code peut les écouter. <strong>Ne mentionnez jamais de noms d&apos;élèves dans le script.</strong> Utilisez des prénoms fictifs ou des initiales.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-gris font-bold text-sm flex-shrink-0 mt-0.5">i</span>
              <p className="text-xs text-jfb-gris">Les fichiers sont hébergés sur <strong className="text-jfb-noir">Archive.org</strong> (États-Unis) — pas sur des serveurs belges ou européens. Informez vos élèves si nécessaire selon la politique de votre établissement.</p>
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-4">Les 4 étapes</h2>

          <div className="space-y-4">

            {/* Étape 1 */}
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-jfb-rose text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-jfb-noir mb-1">Choisissez le type</p>
                  <p className="text-xs text-jfb-gris leading-relaxed mb-3">
                    Sur la page d&apos;accueil, cliquez sur <strong>Dialogue</strong> pour démarrer.
                    Le mode Podcast, plus avancé, permet de générer un audio plus long à partir d&apos;un document Word ou PDF — réservez-le pour plus tard.
                  </p>
                  <div className="bg-jfb-subtil border border-jfb-bordure px-3 py-2 text-xs text-jfb-gris" style={{ borderRadius: '2px' }}>
                    Un <strong>Dialogue</strong> peut comporter jusqu&apos;à 4 personnages et 60 répliques.
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-jfb-rose text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-jfb-noir mb-1">Configurez votre dialogue</p>
                  <p className="text-xs text-jfb-gris leading-relaxed mb-3">
                    Renseignez trois informations, puis cliquez sur <strong>Continuer vers le script</strong>.
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-jfb-subtil border border-jfb-bordure text-[10px] font-bold text-jfb-gris flex items-center justify-center flex-shrink-0 mt-0.5">a</span>
                      <div>
                        <p className="text-xs font-semibold text-jfb-noir">Langue cible</p>
                        <p className="text-xs text-jfb-gris">La langue dans laquelle le dialogue sera enregistré : français, anglais, néerlandais, allemand, espagnol ou italien.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-jfb-subtil border border-jfb-bordure text-[10px] font-bold text-jfb-gris flex items-center justify-center flex-shrink-0 mt-0.5">b</span>
                      <div>
                        <p className="text-xs font-semibold text-jfb-noir">Niveau</p>
                        <p className="text-xs text-jfb-gris">
                          Ce choix détermine la complexité du vocabulaire si l&apos;IA rédige le texte.
                          A1 = mots très simples · B1 = phrases courantes · B2–C1 = registre élaboré.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-jfb-subtil border border-jfb-bordure text-[10px] font-bold text-jfb-gris flex items-center justify-center flex-shrink-0 mt-0.5">c</span>
                      <div>
                        <p className="text-xs font-semibold text-jfb-noir">Locuteurs et voix</p>
                        <p className="text-xs text-jfb-gris">
                          Choisissez 2, 3 ou 4 personnages et attribuez une voix à chacun.
                          Conseil : choisissez des voix de genres différents — elles se distinguent mieux à l&apos;écoute.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-jfb-rose text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-jfb-noir mb-1">Rédigez ou générez le script</p>
                  <p className="text-xs text-jfb-gris leading-relaxed mb-3">
                    Vous avez le choix entre deux approches :
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="border border-jfb-bordure p-3 bg-jfb-subtil" style={{ borderRadius: '2px' }}>
                      <p className="text-xs font-semibold text-jfb-noir mb-1">L&apos;IA écrit à votre place</p>
                      <p className="text-xs text-jfb-gris">
                        Remplissez le formulaire : situation, sujet, consignes particulières.
                        Cliquez sur <strong>Générer le script</strong>.
                        Le texte apparaît — vous pouvez le corriger librement avant de continuer.
                      </p>
                    </div>
                    <div className="border border-jfb-bordure p-3 bg-white" style={{ borderRadius: '2px' }}>
                      <p className="text-xs font-semibold text-jfb-noir mb-1">Vous écrivez vous-même</p>
                      <p className="text-xs text-jfb-gris">
                        Tapez ou collez votre texte dans la zone. Chaque réplique commence par la lettre du personnage suivie d&apos;un deux-points.
                      </p>
                    </div>
                  </div>

                  <div className="border border-jfb-bordure bg-white p-3" style={{ borderRadius: '2px' }}>
                    <p className="text-[10px] font-semibold text-jfb-gris uppercase tracking-wider mb-2">Format attendu — exemple</p>
                    <pre className="text-xs text-jfb-noir font-mono leading-relaxed whitespace-pre-wrap">{`A: Bonjour ! Puis-je vous aider ?
B: Oui, merci. Je cherche la rue des Lilas.
A: C'est tout droit, puis tournez à gauche.
B: Merci beaucoup, c'est très gentil.`}</pre>
                    <p className="text-[10px] text-jfb-gris-cl mt-2">
                      A, B, C, D correspondent aux personnages configurés à l&apos;étape 2.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-jfb-rose text-white text-sm font-bold flex items-center justify-center flex-shrink-0">4</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-jfb-noir mb-1">Générez l&apos;audio et les exercices</p>
                  <p className="text-xs text-jfb-gris leading-relaxed mb-3">
                    Cliquez sur le grand bouton noir <strong>Générer le dialogue audio</strong>.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 mb-4" style={{ borderRadius: '2px' }}>
                    La génération prend <strong>20 à 60 secondes</strong> selon la longueur du dialogue.
                    La page peut sembler bloquée — c&apos;est normal, attendez sans recharger.
                  </div>
                  <p className="text-xs font-semibold text-jfb-noir mb-2">Sur la page résultat, vous trouvez :</p>
                  <ul className="space-y-1.5 text-xs text-jfb-gris">
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span><strong className="text-jfb-noir">Lecteur audio</strong> — écoutez immédiatement le dialogue</span></li>
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span><strong className="text-jfb-noir">QR code + lien permanent</strong> — à projeter, imprimer ou partager</span></li>
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span><strong className="text-jfb-noir">Questions vrai/faux</strong> — compréhension à l&apos;écoute, générées à partir du script</span></li>
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span><strong className="text-jfb-noir">Texte à trous</strong> — mots clés masqués pour un exercice de complétion</span></li>
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span><strong className="text-jfb-noir">Lexique</strong> — liste du vocabulaire du dialogue avec définitions</span></li>
                    <li className="flex gap-2"><span className="text-jfb-rose font-bold flex-shrink-0">→</span><span>
                      <strong className="text-jfb-noir">Cartes flash</strong> — exportables vers{' '}
                      <a href="https://portail-plai.vercel.app" target="_blank" rel="noopener noreferrer"
                        className="underline text-jfb-rose hover:text-jfb-noir transition-colors">FlashPLAI</a>
                      {' '}pour un travail de mémorisation du vocabulaire en autonomie
                    </span></li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* En classe */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-4">Utiliser en classe</h2>
          <div className="bg-white border border-jfb-bordure p-5 space-y-3" style={{ borderRadius: '2px' }}>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Projectez le QR code</strong> sur le tableau ou imprimez-le sur une fiche activité.
                Les élèves le scannent avec leur smartphone et écoutent le dialogue directement dans leur navigateur — sans application à installer, sans compte à créer.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Téléchargez le MP3</strong> pour l&apos;intégrer dans un diaporama, une plateforme de classe (Moodle, Teams…) ou le diffuser depuis votre ordinateur.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Continuité pédagogique :</strong> exportez les cartes flash vers{' '}
                <a href="https://portail-plai.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="underline text-jfb-rose hover:text-jfb-noir transition-colors">FlashPLAI</a>
                {' '}pour que vos élèves mémorisent le vocabulaire du dialogue en autonomie, à leur rythme.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                Les fichiers audio restent accessibles <strong className="text-jfb-noir">sans limite de durée</strong> — vous pouvez réutiliser le même dialogue d&apos;une année à l&apos;autre.
              </p>
            </div>
          </div>
        </section>

        {/* En cas de problème */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-4">En cas de problème</h2>
          <div className="space-y-2">
            {[
              {
                q: 'Le bouton "Générer le script" ne répond pas',
                r: "Attendez quelques secondes et réessayez. Si le problème persiste, rechargez la page — votre script n'est pas sauvegardé automatiquement, notez-le si besoin.",
              },
              {
                q: 'Un message orange apparaît après la génération',
                r: "Le quota journalier a été atteint (100 dialogues par jour partagés entre tous les utilisateurs). Réessayez le lendemain matin. C'est gratuit — il faut juste patienter.",
              },
              {
                q: "L'audio est généré mais le QR code ne fonctionne pas tout de suite",
                r: "Le fichier met 1 à 2 minutes à être disponible sur Internet après la génération. Attendez un peu et scannez à nouveau.",
              },
              {
                q: 'Les voix se ressemblent trop',
                r: "Choisissez une voix féminine et une voix masculine. Si deux personnages ont le même genre, utilisez le registre « Enthousiaste » pour l'un et « Hésitant » pour l'autre.",
              },
              {
                q: 'Je ne sais pas quel niveau choisir',
                r: "A2 pour des élèves débutants, B1 pour un niveau intermédiaire. Vous pouvez toujours corriger le script si le vocabulaire n'est pas adapté.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-jfb-bordure p-4" style={{ borderRadius: '2px' }}>
                <p className="text-xs font-semibold text-jfb-noir mb-1">{item.q}</p>
                <p className="text-xs text-jfb-gris leading-relaxed">{item.r}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Astuce débutant */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-4">Astuce pour commencer</h2>
          <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #1a1a1a' }}>
            <p className="text-xs text-jfb-gris leading-relaxed">
              La première fois, faites un test complet en 5 minutes :{' '}
              <strong className="text-jfb-noir">Dialogue → Français → A2 → 2 locuteurs → une voix féminine et une masculine → laissez l&apos;IA générer → cliquez Générer l&apos;audio.</strong>
              {' '}Vous aurez un dialogue fonctionnel avec QR code et exercices — sans avoir écrit une seule ligne.
            </p>
          </div>
        </section>

        {/* Ancrage pédagogique */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Pourquoi des dialogues audio en cours de langue ?</h2>
          <div className="bg-white border border-jfb-bordure p-4 text-xs text-jfb-gris" style={{ borderRadius: '2px' }}>
            <ul className="space-y-1.5">
              <li>• L&apos;exposition sonore orientée vers la production favorise l&apos;ancrage lexical et phonologique. <span className="text-jfb-gris-cl">(Évrard, 2017 — corpus RISS)</span></li>
              <li>• L&apos;entraînement répété à l&apos;écoute de dialogues réduit les obstacles prosodiques en L2. <span className="text-jfb-gris-cl">(Bidenti, 2024 — corpus RISS)</span></li>
              <li>• Ancrer les apprentissages dans le contexte métier de l&apos;apprenant renforce la mobilisation. <span className="text-jfb-gris-cl">(Payet, 2022 — corpus RISS)</span></li>
            </ul>
          </div>
        </section>

      </div>
    </main>
  )
}
