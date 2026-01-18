/**
 * Menu Configuration
 * Centralized menu structure definition
 */

export const MENU_SECTIONS = [
  {
    id: 'settings',
    title: 'âš™ï¸ NastavenÃ­',
    items: [
      { icon: 'ðŸ¤–', label: 'NastavenÃ­ AI', action: 'aiSettings' },
      { icon: 'ðŸŽ¨', label: 'PÅ™epnout tÃ©ma', action: 'theme' }
    ]
  },
  {
    id: 'tools',
    title: 'ðŸ› ï¸ PokroÄilÃ© nÃ¡stroje',
    items: [
      { icon: 'ðŸ“', label: 'CSS Grid/Flex editor', action: 'gridEditor' },
      { icon: 'ðŸŒ', label: 'Å½ivÃ½ server', action: 'liveServer' },
      { icon: 'ðŸ“', label: 'VytvoÅ™it .gitignore', action: 'gitignore' },
      { icon: 'ðŸ”„', label: 'Nahradit v kÃ³du', action: 'replace', shortcut: 'Ctrl+H' }
    ]
  },
  {
    id: 'content',
    title: 'ðŸ“‹ Obsah',
    items: [
      { icon: 'ðŸ¤–', label: 'AI GenerÃ¡tor komponent', action: 'ai-component' },
      { icon: 'ðŸ§©', label: 'Komponenty', action: 'components' },
      { icon: 'ðŸ“‹', label: 'Å ablony', action: 'templates' },
      { icon: 'ðŸ–¼ï¸', label: 'ObrÃ¡zky', action: 'images' }
    ]
  },
  {
    id: 'sharing',
    title: 'ðŸ”— SdÃ­lenÃ­',
    items: [
      { icon: 'ðŸ”—', label: 'SdÃ­let odkaz', action: 'share' }
    ]
  },
  {
    id: 'github',
    title: 'ðŸ™ GitHub',
    items: [
      { icon: 'ðŸ”', label: 'Hledat na GitHubu', action: 'github-search' },
      { icon: 'ðŸŒ', label: 'NaÄÃ­st z URL', action: 'load-from-url' },
      { icon: 'ðŸš€', label: 'Deploy projekt', action: 'deploy' }
    ]
  },
  {
    id: 'devtools',
    title: 'ðŸ”§ VÃ½vojÃ¡Å™skÃ© nÃ¡stroje',
    items: [
      { icon: 'ðŸ“Š', label: 'Audit projektu', action: 'audit' },
      { icon: 'ðŸ“‹', label: 'Error Log', action: 'error-log' },
      { icon: 'ðŸž', label: 'OtevÅ™Ã­t DevTools', action: 'devtools' }
    ]
  }
];

export const MENU_FOOTER_TEXT = 'ðŸ’¡ Pro zÃ¡kladnÃ­ akce pouÅ¾ijte <strong>logo âš¡</strong> nebo <strong>Ctrl+K</strong>';
