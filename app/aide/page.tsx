export default function AidePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-jfb-noir mb-1">Mode d&apos;emploi</h1>
      <p className="text-jfb-gris text-sm mb-8">Dialogue Audio — PLAI FWB</p>

      <div className="space-y-10">

        {/* Intro */}
        <section>
          <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
            <p className="text-sm font-semibold text-jfb-noir mb-2">À quoi ça sert ?</p>
            <p className="text-sm text-jfb-gris leading-relaxed mb-3">
              Dialogue Audio crée des enregistrements audio de conversations entre plusieurs personnages.
              Vous choisissez la langue, le sujet et les voix. L&apos;outil rédige le texte et génère l&apos;audio automatiquement.
              Résultat : un fichier MP3 et un QR code à projeter ou imprimer en classe.
            </p>
            <p className="text-sm text-jfb-gris leading-relaxed">
              <strong className="text-jfb-noir">Vous n&apos;avez besoin d&apos;aucune compétence technique.</strong>{' '}
              Un navigateur et une connexion Internet suffisent.
            </p>
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
                    Sur la page d&apos;accueil, cliquez sur <strong>Dialogue</strong> (pour démarrer).
                    Le mode Podcast, plus avancé, permet de générer un audio plus long à partir d&apos;un document Word ou PDF — réservez-le pour plus tard.
                  </p>
                  <div className="bg-jfb-subtil border border-jfb-bordure px-3 py-2 text-xs text-jfb-gris" style={{ borderRadius: '2px' }}>
                    Un <strong>Dialogue</strong> peut comporter jusqu&apos;à 4 personnages et 40 répliques.
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
                          Si vous laissez l&apos;IA écrire le texte, ce choix détermine la complexité du vocabulaire utilisé.
                          A1 = mots très simples · B1 = phrases courantes · B2–C1 = registre élaboré.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-jfb-subtil border border-jfb-bordure text-[10px] font-bold text-jfb-gris flex items-center justify-center flex-shrink-0 mt-0.5">c</span>
                      <div>
                        <p className="text-xs font-semibold text-jfb-noir">Locuteurs et voix</p>
                        <p className="text-xs text-jfb-gris">
                          Choisissez 2, 3 ou 4 personnages. Pour chacun, sélectionnez une voix dans la liste.
                          Conseil : choisissez des voix aux genres différents pour qu&apos;elles soient bien distinctes à l&apos;écoute.
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
                        Tapez ou collez directement votre texte dans la zone. Respectez le format suivant :
                        chaque réplique commence par la lettre du personnage suivie d&apos;un deux-points.
                      </p>
                    </div>
                  </div>

                  {/* Exemple de format */}
                  <div className="border border-jfb-bordure bg-white p-3" style={{ borderRadius: '2px' }}>
                    <p className="text-[10px] font-semibold text-jfb-gris uppercase tracking-wider mb-2">Format attendu — exemple</p>
                    <pre className="text-xs text-jfb-noir font-mono leading-relaxed whitespace-pre-wrap">
{`A: Bonjour ! Puis-je vous aider ?
B: Oui, merci. Je cherche la rue des Lilas.
A: C'est tout droit, puis tournez à gauche.
B: Merci beaucoup, c'est très gentil.`}
                    </pre>
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
                  <p className="text-sm font-semibold text-jfb-noir mb-1">Générez l&apos;audio</p>
                  <p className="text-xs text-jfb-gris leading-relaxed mb-3">
                    Cliquez sur le grand bouton noir <strong>Générer le dialogue audio</strong>.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 mb-3" style={{ borderRadius: '2px' }}>
                    La génération prend <strong>20 à 60 secondes</strong> selon la longueur du dialogue.
                    La page peut sembler bloquée — c&apos;est normal, attendez sans recharger.
                  </div>
                  <p className="text-xs text-jfb-gris leading-relaxed">
                    Une fois terminé, vous obtenez un lecteur audio pour écouter immédiatement, un bouton de téléchargement et un <strong>QR code</strong> prêt à l&apos;emploi.
                    Le fichier audio est hébergé sur Internet — il reste accessible sans limite de durée.
                  </p>
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
                Les élèves le scannent avec leur smartphone et écoutent le dialogue directement dans leur navigateur — sans application à installer.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Téléchargez le MP3</strong> pour le glisser dans un diaporama, une plateforme de classe (Moodle, Teams…) ou l&apos;écouter depuis votre ordinateur.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Activités dérivées</strong> disponibles sur la page résultat : questions vrai/faux, texte à trous, lexique, flashcards.
                Un clic suffit pour les générer.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-jfb-rose font-bold text-sm flex-shrink-0">→</span>
              <p className="text-xs text-jfb-gris leading-relaxed">
                <strong className="text-jfb-noir">Confidentialité :</strong> le fichier audio est public (accessible à qui connaît le lien).
                Ne mentionnez pas de noms d&apos;élèves dans le script.
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
                r: "Attendez quelques secondes et réessayez. Si le problème persiste, rechargez la page et recommencez depuis l'étape 3 — votre script n'est pas sauvegardé automatiquement, notez-le si besoin.",
              },
              {
                q: 'Un message orange apparaît après la génération',
                r: "Le quota journalier a été atteint (100 dialogues par jour partagés). Réessayez le lendemain matin. C'est gratuit — il faut juste patienter.",
              },
              {
                q: "L'audio est généré mais le QR code ne fonctionne pas tout de suite",
                r: "Le fichier met environ 1 à 2 minutes à être disponible sur Internet après la génération. Attendez un peu et scannez à nouveau.",
              },
              {
                q: 'Les voix se ressemblent trop',
                r: "Choisissez des voix de genres différents (une féminine et une masculine). Si vous avez deux personnages du même genre, essayez le registre « Enthousiaste » pour l'un et « Hésitant » pour l'autre.",
              },
              {
                q: 'Je ne sais pas quel niveau choisir',
                r: "Choisissez A2 pour des élèves débutants, B1 pour un niveau intermédiaire. Vous pouvez toujours corriger le script généré si le vocabulaire n'est pas adapté.",
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
              {' '}Vous aurez un dialogue fonctionnel sans avoir à écrire une seule ligne.
              Ensuite, personnalisez à votre rythme.
            </p>
          </div>
        </section>

        {/* Ancrage pédagogique — discret */}
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
