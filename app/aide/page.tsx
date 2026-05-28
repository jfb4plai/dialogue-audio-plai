export default function AidePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-jfb-noir mb-1">Mode d&apos;emploi</h1>
      <p className="text-jfb-gris text-sm mb-8">Dialogue Audio — PLAI FWB</p>

      <div className="space-y-8">

        {/* Principe */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Principe</h2>
          <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
            <p className="text-sm text-jfb-gris leading-relaxed">
              Dialogue Audio génère des conversations audio multivoix pour l&apos;enseignement des langues.
              Chaque dialogue est synthétisé par IA, converti en MP3 et hébergé sur Archive.org.
              Un QR code imprimable permet un accès immédiat depuis la salle de classe.
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['1. Type', '2. Config', '3. Script', '4. Audio'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-jfb-gris">
                  <span className="font-semibold text-jfb-noir">{s}</span>
                  {i < 3 && <span className="text-jfb-gris-cl">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Étapes */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Étapes</h2>
          <div className="space-y-3">
            {[
              {
                n: '1',
                titre: 'Type',
                texte: 'Choisissez Dialogue (2 à 4 locuteurs, jusqu\'à 40 répliques) ou Podcast (2 locuteurs, script long depuis document).',
              },
              {
                n: '2',
                titre: 'Configuration',
                texte: 'Définissez la langue cible, le niveau CECRL, le nombre de locuteurs et les voix. Le niveau CECRL influence la complexité du vocabulaire dans le script généré par l\'IA.',
              },
              {
                n: '3',
                titre: 'Script',
                texte: 'Générez via l\'IA (formulaire guidé ou document Word/PDF), ou collez votre propre script. Format : A: texte · B: texte · C: texte · D: texte. Relisez et modifiez avant de générer l\'audio.',
              },
              {
                n: '4',
                titre: 'Génération audio',
                texte: 'Cliquez "Générer le dialogue audio". Comptez 20 à 60 secondes. L\'URL et le QR code sont disponibles immédiatement — le fichier MP3 sur Archive.org est accessible après ~1 minute.',
              },
            ].map(s => (
              <div key={s.n} className="bg-white border border-jfb-bordure p-4 flex gap-4" style={{ borderRadius: '2px' }}>
                <span className="w-6 h-6 rounded-full bg-jfb-rose text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-jfb-noir mb-1">{s.titre}</p>
                  <p className="text-xs text-jfb-gris leading-relaxed">{s.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Voix */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Choix des voix</h2>
          <div className="space-y-3">
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
              <p className="text-xs font-semibold text-jfb-noir mb-2">2 locuteurs — Gemini TTS</p>
              <ul className="space-y-1.5 text-xs text-jfb-gris">
                <li>• 16 voix disponibles (8 féminines, 8 masculines) choisies pour leur contraste maximal.</li>
                <li>• Pour deux locuteurs du même genre, combinez des caractères opposés : <em>jeune, légère</em> + <em>mature, posée</em>.</li>
                <li>• Si les voix se ressemblent encore, ajoutez un registre contrasté : <strong>Enthousiaste</strong> (débit rapide) pour l&apos;un, <strong>Hésitant</strong> (débit lent) pour l&apos;autre.</li>
                <li>• Le registre <em>warm</em> a été retiré car il efface les différences entre voix féminines calmes.</li>
              </ul>
            </div>
            <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px', borderLeft: '3px solid #1a1a1a' }}>
              <p className="text-xs font-semibold text-jfb-noir mb-2">3-4 locuteurs — ElevenLabs</p>
              <ul className="space-y-1.5 text-xs text-jfb-gris">
                <li>• Voix de synthèse multilingues haute qualité (modèle <code className="bg-jfb-subtil px-1">eleven_multilingual_v2</code>).</li>
                <li>• 4 voix féminines et 4 voix masculines disponibles par dialogue.</li>
                <li>• La génération est séquentielle : comptez 30 à 90 secondes pour 20 répliques.</li>
                <li>• Les tags de registre (Enthousiaste, Hésitant…) ne s&apos;appliquent pas en mode ElevenLabs — la différenciation repose uniquement sur le choix de voix.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Quotas */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Quotas et limites</h2>
          <div className="bg-white border border-jfb-bordure overflow-hidden" style={{ borderRadius: '2px' }}>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-jfb-subtil border-b border-jfb-bordure">
                  <th className="text-left px-4 py-2 font-semibold text-jfb-noir">Moteur</th>
                  <th className="text-left px-4 py-2 font-semibold text-jfb-noir">Usage</th>
                  <th className="text-left px-4 py-2 font-semibold text-jfb-noir">Limite (plan gratuit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jfb-bordure text-jfb-gris">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-jfb-rose">Gemini TTS</td>
                  <td className="px-4 py-2.5">2 locuteurs</td>
                  <td className="px-4 py-2.5">100 dialogues/jour</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-jfb-noir">ElevenLabs</td>
                  <td className="px-4 py-2.5">3-4 locuteurs</td>
                  <td className="px-4 py-2.5">~10 000 car./mois ≈ 8 dialogues</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-jfb-gris">Script IA (Claude)</td>
                  <td className="px-4 py-2.5">Génération de scripts</td>
                  <td className="px-4 py-2.5">10 générations/heure</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-jfb-gris-cl">
            En cas de quota Gemini épuisé, un message orange indique le délai avant réinitialisation (minuit heure UTC).
          </p>
        </section>

        {/* Partage */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Partage et réutilisation</h2>
          <div className="bg-white border border-jfb-bordure p-5" style={{ borderRadius: '2px' }}>
            <ul className="space-y-2 text-xs text-jfb-gris">
              <li>• Le QR code généré pointe vers le MP3 hébergé sur <strong>Archive.org</strong> — lien permanent, pas d&apos;expiration.</li>
              <li>• Téléchargez le MP3 directement depuis la page résultat via le bouton de téléchargement.</li>
              <li>• Les activités dérivées (FlashPLAI, Vrai/Faux, Texte à trous, Lexique) sont disponibles sur la page résultat.</li>
              <li>• Ne pas inclure de données personnelles (noms d&apos;élèves, informations privées) dans le script — les fichiers audio sont publics.</li>
            </ul>
          </div>
        </section>

        {/* Ancrage */}
        <section>
          <h2 className="text-[11px] font-semibold text-jfb-rose uppercase tracking-[0.12em] mb-3">Ancrage pédagogique</h2>
          <div className="bg-white border border-jfb-bordure p-5 text-xs text-jfb-gris" style={{ borderRadius: '2px' }}>
            <p className="mb-2">L&apos;efficacité des dialogues audio en LVE est documentée dans le corpus RISS (522 627 articles scientifiques francophones) :</p>
            <ul className="space-y-1">
              <li>• <strong>Écoute-acquisition</strong> — L&apos;exposition sonore orientée vers la production favorise l&apos;ancrage lexical et phonologique. <span className="text-jfb-gris-cl">(Évrard, 2017)</span></li>
              <li>• <strong>Prosodie et compréhension L2</strong> — L&apos;entraînement répété à l&apos;écoute de dialogues réduit les obstacles prosodiques. <span className="text-jfb-gris-cl">(Bidenti, 2024)</span></li>
              <li>• <strong>Contextualisation professionnelle</strong> — Ancrer les apprentissages dans la filière métier mobilise les apprenants. <span className="text-jfb-gris-cl">(Payet, 2022)</span></li>
            </ul>
          </div>
        </section>

      </div>
    </main>
  )
}
