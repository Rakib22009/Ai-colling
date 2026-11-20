export type UiLang = 'en' | 'bn' | 'id';

export const UI_LANG_OPTIONS: Array<{ code: UiLang; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'bn', label: 'Bangla', nativeLabel: 'বাংলা' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
];

export interface TranslationDict {
  common: {
    appName: string;
    loading: string;
    online: string;
    offline: string;
    accept: string;
    decline: string;
    cancel: string;
    close: string;
    save: string;
    saving: string;
    back: string;
    copy: string;
    copied: string;
    retry: string;
    voice: string;
    video: string;
    signOut: string;
    light: string;
    dark: string;
    uiLanguageLabel: string;
    bangla: string;
    indonesian: string;
    english: string;
    swap: string;
    open: string;
  };
  nav: {
    home: string;
    dashboard: string;
    friends: string;
    myProfile: string;
    languages: string;
    history: string;
    calls: string;
    settings: string;
    about: string;
    notifications: string;
    studioReady: string;
    connecting: string;
    activeCallBanner: string;
    returnToCall: string;
  };
  splash: {
    signIn: string;
    getStarted: string;
    architecture: string;
    openStudio: string;
    gmailLogin: string;
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    enterStudio: string;
    continueWithGmail: string;
    createProfileUrl: string;
    dualStreamsTitle: string;
    dualStreamsDesc: string;
    webrtcTitle: string;
    webrtcDesc: string;
    privateCallsTitle: string;
    privateCallsDesc: string;
    previewLabel: string;
    dhakaTitle: string;
    dhakaDesc: string;
    jakartaTitle: string;
    jakartaDesc: string;
    footerNote: string;
    aboutPrivacy: string;
    loginLink: string;
  };
  auth: {
    backToWelcome: string;
    backToSignIn: string;
    loginTitle: string;
    loginSubtitle: string;
    loginDesc: string;
    chooseWebsiteLanguage: string;
    emailTab: string;
    googleTab: string;
    emailLabel: string;
    passwordLabel: string;
    displayNameLabel: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    namePlaceholder: string;
    signInEmailBtn: string;
    signingIn: string;
    signUpEmailBtn: string;
    creatingAccount: string;
    forgotPassword: string;
    resetSent: string;
    orContinueWith: string;
    signInGoogleBtn: string;
    continueGoogleBtn: string;
    oauthNoticeTitle: string;
    oauthNoticeBody: string;
    verifyTitle: string;
    verifyBody: string;
    verifyCheckBtn: string;
    verifyResendBtn: string;
    verifySignOutBtn: string;
    featureFriends: string;
    featurePush: string;
    featureSecurity: string;
    noAccountYet: string;
    createAccountLink: string;
    alreadyHaveAccount: string;
    signInLink: string;
    signupTitle: string;
    signupSubtitle: string;
    primarySpokenLang: string;
    banglaSub: string;
    indonesianSub: string;
    handleLabel: string;
    handleHint: string;
  };
  dashboard: {
    enablePushTitle: string;
    enablePushDesc: string;
    allowNotifications: string;
    statusOnline: string;
    statusOffline: string;
    uniqueProfileUrl: string;
    copyLink: string;
    activeBidirectional: string;
    youSpeakPrefix: string;
    voicePersonaPrefix: string;
    configure: string;
    addFriendGmail: string;
    aiPhrase: string;
    quickSendTitle: string;
    quickSendPlaceholder: string;
    incomingRequests: string;
    incomingEmpty: string;
    manageFriendsBtn: string;
    friendsDirectory: string;
    friendsSubtitle: string;
    invite: string;
    noFriendsTitle: string;
    noFriendsDesc: string;
    copyMyLink: string;
    pendingSent: string;
    waitingFor: string;
    recentCalls: string;
    viewAll: string;
    noCallsYet: string;
  };
  languages: {
    title: string;
    subtitle: string;
    spokenLangTitle: string;
    spokenLangDesc: string;
    bnDesc: string;
    idDesc: string;
    autoVerifyTitle: string;
    autoVerifyDesc: string;
    voicePersonaTitle: string;
    voicePersonaDesc: string;
    preview: string;
    fidelityTitle: string;
    fidelityDesc: string;
    savePrefs: string;
    liveTestTitle: string;
    liveTestDesc: string;
    startLiveTest: string;
    stopLiveTest: string;
    liveTestListening: string;
    liveTestConnecting: string;
    liveTestIdle: string;
    testDirection: string;
  };
  call: {
    noActiveVoice: string;
    noActiveVideo: string;
    returnDashboard: string;
    voiceCall: string;
    videoCall: string;
    aiTranslation: string;
    ringingPeer: string;
    callingPeer: string;
    waitingPeerVideo: string;
    secureAudio: string;
    micMuted: string;
    capturingPcm: string;
    youSpeak: string;
    partnerHears: string;
    switchLabel: string;
    translatedVoice: string;
    originalAudio: string;
    liveCaptions: string;
    liveCaptionsDesc: string;
    aiSummary: string;
    summarizing: string;
    callSummary: string;
    captionsOn: string;
    captionsOff: string;
    captionsTurnedOff: string;
    listeningSpeech: string;
    captionsHint: string;
    mute: string;
    unmute: string;
    translationOn: string;
    translationOff: string;
    translateOnShort: string;
    translateOffShort: string;
    phrases: string;
    endCall: string;
    endShort: string;
    cameraOff: string;
    camOff: string;
    camOn: string;
    audioTranslated: string;
    audioOriginal: string;
    incomingVoiceCall: string;
    incomingVideoCall: string;
    aiTranslationLabel: string;
  };
  history: {
    title: string;
    subtitle: string;
    zeroRecording: string;
    filterAll: string;
    filterVoice: string;
    filterVideo: string;
    filterMissed: string;
    searchPlaceholder: string;
    noMatches: string;
    noMatchesDesc: string;
    outgoing: string;
    incoming: string;
    summaryPrefix: string;
  };
  settings: {
    title: string;
    subtitle: string;
    lightTheme: string;
    darkTheme: string;
    websiteLangTitle: string;
    websiteLangDesc: string;
    profileTitle: string;
    displayName: string;
    uniqueHandle: string;
    bioLabel: string;
    bioPlaceholder: string;
    saveProfile: string;
    prefsTitle: string;
    autoStartTitle: string;
    autoStartDesc: string;
    defaultTranslatedTitle: string;
    defaultTranslatedDesc: string;
    enableCaptionsTitle: string;
    enableCaptionsDesc: string;
    noStorageNote: string;
    diagnosticsTitle: string;
    webPushTitle: string;
    browserPerm: string;
    sendTestNotif: string;
    enableNotifs: string;
    hardwareTitle: string;
    hardwareIdle: string;
    testMicCam: string;
    stopTest: string;
    signedInAs: string;
  };
  about: {
    title: string;
    subtitle: string;
    howItWorksTitle: string;
    dualStreamTitle: string;
    dualStreamDesc: string;
    webrtcTitle: string;
    webrtcDesc: string;
    securityTitle: string;
    zeroDemoTitle: string;
    zeroDemoDesc: string;
    noRecordTitle: string;
    noRecordDesc: string;
    fidelityTitle: string;
    fidelityDesc: string;
    readinessTitle: string;
    backendServer: string;
    geminiLive: string;
    firebaseProject: string;
    ready: string;
    checking: string;
    configured: string;
    missingKey: string;
    connected: string;
    pending: string;
  };
  profile: {
    signInPromptTitle: string;
    signInPromptDesc: string;
    loading: string;
    notFoundTitle: string;
    notFoundDesc: string;
    backDashboard: string;
    editMyProfile: string;
    voiceCall: string;
    videoCall: string;
    friendReqSent: string;
    respondDashboard: string;
    sendFriendReq: string;
    shareableLinks: string;
    copyUidUrl: string;
    copyHandleUrl: string;
  };
  notificationsDrawer: {
    title: string;
    pendingRequests: string;
    incomingEmpty: string;
    openFriendsPage: string;
    recentAlerts: string;
    empty: string;
    markRead: string;
    viewProfile: string;
  };
  addFriend: {
    title: string;
    enterGmail: string;
    find: string;
    connectedOrPending: string;
    alreadySentYouHint: string;
    sendRequest: string;
    sending: string;
    notRegisteredTitle: string;
    notRegisteredDesc: string;
    copyShareLink: string;
    importContactsTitle: string;
    importContactsDesc: string;
    loadContacts: string;
    refreshContacts: string;
    noContacts: string;
    checkAndInvite: string;
  };
  friendsPage: {
    title: string;
    subtitle: string;
    sendCardTitle: string;
    sendCardDesc: string;
    sendPlaceholder: string;
    sendBtn: string;
    incomingTitle: string;
    incomingDesc: string;
    incomingEmpty: string;
    outgoingTitle: string;
    outgoingEmpty: string;
    cancelRequest: string;
    connectedTitle: string;
    connectedEmpty: string;
    viewProfile: string;
  };
  phraseDrawer: {
    title: string;
    tabPhrase: string;
    tabNuance: string;
    tabContext: string;
    googleSearch: string;
    googleMaps: string;
    translateBtn: string;
    nuanceBtn: string;
    mapsBtn: string;
    searchBtn: string;
    naturalTranslation: string;
    pronunciation: string;
    verifiedSources: string;
  };
}

export const TRANSLATIONS: Record<UiLang, TranslationDict> = {
  en: {
    common: {
      appName: 'LinguaConnect AI',
      loading: 'Starting LinguaConnect AI...',
      online: 'Online',
      offline: 'Offline',
      accept: 'Accept',
      decline: 'Decline',
      cancel: 'Cancel',
      close: 'Close',
      save: 'Save',
      saving: 'Saving...',
      back: 'Back',
      copy: 'Copy',
      copied: 'Copied',
      retry: 'Retry',
      voice: 'Voice',
      video: 'Video',
      signOut: 'Sign Out',
      light: 'Light',
      dark: 'Dark',
      uiLanguageLabel: 'Website Language',
      bangla: 'Bangla (বাংলা)',
      indonesian: 'Bahasa Indonesia',
      english: 'English',
      swap: 'Swap',
      open: 'Open',
    },
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      friends: 'Friends',
      myProfile: 'My Profile',
      languages: 'Languages',
      history: 'History',
      calls: 'Calls',
      settings: 'Settings',
      about: 'About',
      notifications: 'Notifications',
      studioReady: 'Signaling Ready',
      connecting: 'Connecting...',
      activeCallBanner: 'Active call with',
      returnToCall: 'Return to Call',
    },
    splash: {
      signIn: 'Sign In',
      getStarted: 'Get Started',
      architecture: 'Architecture',
      openStudio: 'Open Studio',
      gmailLogin: 'Sign In',
      badge: 'Bangla (বাংলা) ↔ Bahasa Indonesia · Real-Time Speech-to-Speech',
      heroTitle: 'Speak naturally in your language. Be heard in theirs.',
      heroSubtitle:
        'LinguaConnect AI bridges live voice and video calls between Bangla and Indonesian speakers using isolated bidirectional Gemini Live translation streams, crisp dual captions, and instant friend calling.',
      enterStudio: 'Enter Call Studio',
      continueWithGmail: 'Sign In / Get Started',
      createProfileUrl: 'Create Profile URL',
      dualStreamsTitle: 'Dual Streams',
      dualStreamsDesc: 'Zero echo or audio loops',
      webrtcTitle: 'WebRTC HD',
      webrtcDesc: 'Resilient peer video & fallback',
      privateCallsTitle: 'Private Calls',
      privateCallsDesc: 'No default audio recording',
      previewLabel: 'Live Bilingual Subtitles Preview',
      dhakaTitle: 'Dhaka · বাংলা (Bangla)',
      dhakaDesc: 'Natural Bengali pronunciation',
      jakartaTitle: 'Jakarta · Bahasa Indonesia',
      jakartaDesc: 'Instant Indonesian voice',
      footerNote: 'LinguaConnect AI · Verified Accounts Only',
      aboutPrivacy: 'About & Privacy',
      loginLink: 'Login',
    },
    auth: {
      backToWelcome: 'Back to Welcome',
      backToSignIn: 'Back to Sign In',
      loginTitle: 'Sign in to LinguaConnect AI',
      loginSubtitle: 'Secure Firebase Authentication · Real-time calling',
      loginDesc:
        'Sign in with your Email & Password or verified Google account to call friends with real-time Bangla ↔ Indonesian voice translation.',
      chooseWebsiteLanguage: 'Website Display Language',
      emailTab: 'Email & Password',
      googleTab: 'Google / Gmail',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      displayNameLabel: 'Full Name',
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: 'At least 6 characters',
      namePlaceholder: 'Your full name',
      signInEmailBtn: 'Sign In with Email',
      signingIn: 'Signing in...',
      signUpEmailBtn: 'Create Account',
      creatingAccount: 'Creating Account...',
      forgotPassword: 'Forgot password?',
      resetSent: 'Password reset link sent to your email inbox.',
      orContinueWith: 'or continue with Google',
      signInGoogleBtn: 'Sign in with Google',
      continueGoogleBtn: 'Continue with Google',
      oauthNoticeTitle: 'Google Sign-In Testing Mode Notice',
      oauthNoticeBody:
        'If Google shows "Error 403: access_denied", your GCP OAuth Consent Screen is in Testing mode (add the Gmail address under Test users in Google Cloud Console) OR sign in with Email & Password above.',
      verifyTitle: 'Verify Your Email Address',
      verifyBody:
        'A verification link was sent to your inbox. Please click the link to verify your account, then press Continue below.',
      verifyCheckBtn: 'I Verified My Email — Continue',
      verifyResendBtn: 'Resend Verification Email',
      verifySignOutBtn: 'Use a Different Account',
      featureFriends: 'Add friends directly by Gmail or Google Contacts',
      featurePush: 'Instant browser Web Notifications for incoming voice & video calls',
      featureSecurity: 'Secured by Firebase Authentication & isolated Firestore rules',
      noAccountYet: 'New to LinguaConnect AI?',
      createAccountLink: 'Create an account',
      alreadyHaveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      signupTitle: 'Create Your LinguaConnect Profile',
      signupSubtitle:
        'Choose your website language, spoken language, and unique profile URL.',
      primarySpokenLang: 'Your Primary Spoken Language',
      banglaSub: 'বাংলা (Bengali)',
      indonesianSub: 'Bahasa Indonesia',
      handleLabel: 'Unique Shareable Handle (Optional)',
      handleHint: 'Every user automatically receives /profile/[uid] and /u/[handle] links.',
    },
    dashboard: {
      enablePushTitle: 'Enable Web Push Notifications for Incoming Calls',
      enablePushDesc:
        'Receive instant browser alerts with Accept and Decline buttons when a friend calls you or sends a request.',
      allowNotifications: 'Allow Notifications',
      statusOnline: 'Status: Online',
      statusOffline: 'Status: Offline',
      uniqueProfileUrl: 'Your Unique Shareable Profile URL',
      copyLink: 'Copy Link',
      activeBidirectional: 'Active Bidirectional Translation',
      youSpeakPrefix: 'You speak',
      voicePersonaPrefix: 'Voice persona',
      configure: 'Configure',
      addFriendGmail: 'Send Friend Request',
      aiPhrase: 'AI Phrase',
      quickSendTitle: 'Send a Friend Request',
      quickSendPlaceholder: 'Enter friend@gmail.com or @handle...',
      incomingRequests: 'Incoming Friend Requests',
      incomingEmpty: 'No pending incoming friend requests right now. New requests appear here instantly.',
      manageFriendsBtn: 'Friends & Requests Hub',
      friendsDirectory: 'Friends & Direct Calling',
      friendsSubtitle: 'Real verified contacts · Click Voice or Video to call with instant translation',
      invite: 'Invite',
      noFriendsTitle: 'No friends connected yet',
      noFriendsDesc:
        'Invite a friend using their exact email address or @handle, import from Google Contacts, or share your unique profile URL.',
      copyMyLink: 'Copy My Profile Link',
      pendingSent: 'Sent Requests Pending',
      waitingFor: 'Waiting for acceptance:',
      recentCalls: 'Recent Calls',
      viewAll: 'View All',
      noCallsYet: 'No calls recorded yet. Start a voice or video call with a connected friend.',
    },
    languages: {
      title: 'Language & Translation Studio',
      subtitle:
        'Configure your spoken language, test 100% live Gemini voice translation, and preview synthesized voices.',
      spokenLangTitle: 'Your Spoken Language',
      spokenLangDesc:
        'When you speak Bangla, your partner hears Indonesian. When you speak Indonesian, your partner hears Bangla.',
      bnDesc: 'You speak Bangla → Partner hears Bahasa Indonesia',
      idDesc: 'You speak Indonesian → Partner hears বাংলা (Bangla)',
      autoVerifyTitle: 'Automatic Language Verification',
      autoVerifyDesc:
        'Monitor spoken input and allow manual mid-call override if code-switching occurs.',
      voicePersonaTitle: 'Voice Preview & Persona',
      voicePersonaDesc: 'Test natural Bangla or Indonesian speech synthesis using Gemini Flash TTS.',
      preview: 'Preview',
      fidelityTitle: 'Bangla & Indonesian Linguistic Isolation',
      fidelityDesc:
        'LinguaConnect AI binds explicit BCP-47 language targets (bn for Bangla, id for Bahasa Indonesia) with echoTargetLanguage: false so Bangla is never drifted toward Hindi and Indonesian is never drifted toward Malay.',
      savePrefs: 'Save Language Preferences',
      liveTestTitle: '100% Live Voice Translation Mic Test',
      liveTestDesc:
        'Speak into your microphone right now to verify real-time Gemini Live speech-to-speech translation and live subtitles.',
      startLiveTest: 'Start Live Voice Test',
      stopLiveTest: 'Stop Voice Test',
      liveTestListening: 'Listening & translating live speech...',
      liveTestConnecting: 'Connecting to Gemini Live Translation...',
      liveTestIdle: 'Press Start and speak naturally into your microphone.',
      testDirection: 'Translation Direction',
    },
    call: {
      noActiveVoice: 'No active voice call session',
      noActiveVideo: 'No active video call session',
      returnDashboard: 'Return to Dashboard',
      voiceCall: 'Voice Call',
      videoCall: 'Video Call',
      aiTranslation: 'AI Translation',
      ringingPeer: 'Ringing peer...',
      callingPeer: 'Calling',
      waitingPeerVideo: 'Waiting for peer video...',
      secureAudio: 'Secure bidirectional audio',
      micMuted: 'Microphone Muted',
      capturingPcm: 'Capturing 16kHz PCM audio',
      youSpeak: 'You Speak',
      partnerHears: 'Partner Hears',
      switchLabel: 'Switch',
      translatedVoice: 'Translated Voice',
      originalAudio: 'Original Audio',
      liveCaptions: 'Live Bilingual Captions',
      liveCaptionsDesc: 'Original speech paired with real-time translated output',
      aiSummary: 'AI Summary',
      summarizing: 'Summarizing...',
      callSummary: 'Call Summary',
      captionsOn: 'Captions On',
      captionsOff: 'Captions Off',
      captionsTurnedOff: 'Live captions are turned off.',
      listeningSpeech: 'Listening for Bangla or Indonesian speech...',
      captionsHint: 'Original and translated subtitles appear here as you speak.',
      mute: 'Mute',
      unmute: 'Unmute',
      translationOn: 'Translation On',
      translationOff: 'Translation Off',
      translateOnShort: 'Translate On',
      translateOffShort: 'Translate Off',
      phrases: 'Phrases',
      endCall: 'End Call',
      endShort: 'End',
      cameraOff: 'Camera Off',
      camOff: 'Cam Off',
      camOn: 'Cam On',
      audioTranslated: 'Audio: Translated',
      audioOriginal: 'Audio: Original',
      incomingVoiceCall: 'Incoming Voice Call',
      incomingVideoCall: 'Incoming Video Call',
      aiTranslationLabel: 'AI Translation',
    },
    history: {
      title: 'Call History',
      subtitle: 'Metadata stored securely in Firestore. Call audio and video are never recorded.',
      zeroRecording: 'Zero media recording',
      filterAll: 'All',
      filterVoice: 'Voice',
      filterVideo: 'Video',
      filterMissed: 'Missed',
      searchPlaceholder: 'Search participant...',
      noMatches: 'No matching call records',
      noMatchesDesc: 'Calls you place or receive appear here with duration, language pair, and status.',
      outgoing: 'Outgoing',
      incoming: 'Incoming',
      summaryPrefix: 'Summary:',
    },
    settings: {
      title: 'Settings & Account',
      subtitle:
        'Manage your website language, profile URL, audio/translation defaults, hardware permissions, and notifications.',
      lightTheme: 'Light Theme',
      darkTheme: 'Dark Theme',
      websiteLangTitle: 'Website Interface Language',
      websiteLangDesc: 'Switch all menus, buttons, and labels across the entire website immediately.',
      profileTitle: 'Profile & Unique URL',
      displayName: 'Display Name',
      uniqueHandle: 'Unique Profile Handle',
      bioLabel: 'Bio / Greeting',
      bioPlaceholder: 'Available for Dhaka ↔ Jakarta calls...',
      saveProfile: 'Save Profile',
      prefsTitle: 'Translation, Audio & Privacy',
      autoStartTitle: 'Auto-Start Real-Time AI Translation',
      autoStartDesc: 'Automatically launch bidirectional speech-to-speech translation when calls connect.',
      defaultTranslatedTitle: 'Default to Translated Voice Output',
      defaultTranslatedDesc: 'Mute peer original audio while translated speech plays to prevent echo or mixing.',
      enableCaptionsTitle: 'Enable Live Bilingual Captions',
      enableCaptionsDesc: 'Show real-time Bangla and Indonesian subtitles during voice and video calls.',
      noStorageNote:
        'Audio and video streams are peer-to-peer / real-time transient and are never stored in Firestore.',
      diagnosticsTitle: 'Permissions & Diagnostics',
      webPushTitle: 'Web Push Call Notifications',
      browserPerm: 'Browser permission:',
      sendTestNotif: 'Send Test Notification',
      enableNotifs: 'Enable Notifications',
      hardwareTitle: 'Microphone & Camera Hardware Check',
      hardwareIdle: 'Verify browser audio/video access before joining a call.',
      testMicCam: 'Test Mic & Camera',
      stopTest: 'Stop Test',
      signedInAs: 'Signed in as',
    },
    about: {
      title: 'About LinguaConnect AI',
      subtitle:
        'Real-time bidirectional Bangla (বাংলা) ↔ Indonesian (Bahasa Indonesia) voice and video communication studio.',
      howItWorksTitle: 'How Bidirectional Translation Works',
      dualStreamTitle: 'Isolated Dual Audio Streams',
      dualStreamDesc:
        'Each participant captures 16kHz PCM audio with hardware echo cancellation and streams into an independent Gemini Live Translation session. Translated 24kHz audio is routed strictly to the listening partner—never back into the speaker’s input.',
      webrtcTitle: 'Decoupled WebRTC Video',
      webrtcDesc:
        'Peer-to-peer WebRTC carries HD camera video and optional original-voice fallback. Even if the translation WebSocket encounters temporary latency, your live call remains connected and automatically recovers.',
      securityTitle: 'Privacy, Security & Linguistic Precision',
      zeroDemoTitle: 'Zero Demo Accounts & Verified Auth:',
      zeroDemoDesc:
        'Every user signs in with a verified email or Google account. Email lookups use deterministic SHA-256 hashes so raw addresses are never exposed in public queries.',
      noRecordTitle: 'No Default Recording:',
      noRecordDesc:
        'Voice and video media are never saved or archived. Firestore stores only call metadata strictly scoped to participants.',
      fidelityTitle: 'Bangla & Indonesian Fidelity:',
      fidelityDesc:
        'Explicitly locks BCP-47 bn and id translation targets to preserve cultural politeness and prevent confusion with Hindi or Malay.',
      readinessTitle: 'Service Readiness',
      backendServer: 'Backend Server:',
      geminiLive: 'Gemini Live API:',
      firebaseProject: 'Firebase Project:',
      ready: 'Ready',
      checking: 'Checking...',
      configured: 'Configured',
      missingKey: 'Missing Key',
      connected: 'Connected',
      pending: 'Pending',
    },
    profile: {
      signInPromptTitle: 'Sign in to view this LinguaConnect Profile',
      signInPromptDesc:
        'Verify your account to view this user’s profile, send a friend request, or start a live translated call.',
      loading: 'Loading profile...',
      notFoundTitle: 'Profile Not Found',
      notFoundDesc: 'No LinguaConnect AI profile matches',
      backDashboard: 'Back to Dashboard',
      editMyProfile: 'Edit My Profile',
      voiceCall: 'Voice Call',
      videoCall: 'Video Call',
      friendReqSent: 'Friend Request Sent',
      respondDashboard: 'Respond in Dashboard',
      sendFriendReq: 'Send Friend Request',
      shareableLinks: 'Unique Shareable Profile Links',
      copyUidUrl: 'Copy UID URL',
      copyHandleUrl: 'Copy Handle URL',
    },
    notificationsDrawer: {
      title: 'Notifications & Requests',
      pendingRequests: 'Incoming Friend Requests',
      incomingEmpty: 'No incoming friend requests right now.',
      openFriendsPage: 'Send or Manage Requests',
      recentAlerts: 'Recent Alerts',
      empty: 'No notifications yet. Incoming calls and friend updates appear here in real time.',
      markRead: 'Mark read',
      viewProfile: 'View Profile',
    },
    addFriend: {
      title: 'Send Friend Request',
      enterGmail: 'Enter friend’s registered email address or @handle',
      find: 'Find',
      connectedOrPending: 'Connected / Pending',
      alreadySentYouHint: 'Sent you a request — accept below:',
      sendRequest: 'Send Request',
      sending: 'Sending...',
      notRegisteredTitle: 'is not registered on LinguaConnect AI yet.',
      notRegisteredDesc:
        'Since LinguaConnect AI uses 100% real accounts (zero demo profiles), share your unique profile URL so they can sign in first.',
      copyShareLink: 'Copy your shareable profile URL',
      importContactsTitle: 'Import from Google Contacts',
      importContactsDesc: 'Load your real Google contacts to send instant friend requests.',
      loadContacts: 'Load Contacts',
      refreshContacts: 'Refresh Contacts',
      noContacts: 'No contacts with email addresses were returned from your Google Contacts list.',
      checkAndInvite: 'Check & Invite',
    },
    friendsPage: {
      title: 'Friends & Friend Requests',
      subtitle: 'Send friend requests by Email or @handle, accept incoming requests, and place direct translated calls.',
      sendCardTitle: 'Send a Friend Request',
      sendCardDesc: 'Look up any registered LinguaConnect AI user by their Gmail/email address or @handle.',
      sendPlaceholder: 'friend@gmail.com or @handle',
      sendBtn: 'Send Request',
      incomingTitle: 'Incoming Friend Requests',
      incomingDesc: 'Accept or decline requests from people who want to connect with you.',
      incomingEmpty: 'No incoming friend requests at the moment.',
      outgoingTitle: 'Sent Friend Requests (Waiting)',
      outgoingEmpty: 'No pending outgoing requests.',
      cancelRequest: 'Cancel Request',
      connectedTitle: 'Connected Friends',
      connectedEmpty: 'Accepted friends appear here for 1-click translated Voice and Video calling.',
      viewProfile: 'Profile',
    },
    phraseDrawer: {
      title: 'Smart Phrase & Context',
      tabPhrase: 'Quick Phrase',
      tabNuance: 'Deep Nuance',
      tabContext: 'Search & Maps',
      googleSearch: 'Google Search',
      googleMaps: 'Google Maps',
      translateBtn: 'Translate Instantly',
      nuanceBtn: 'Analyze Cultural & Grammar Nuance',
      mapsBtn: 'Search Places on Maps',
      searchBtn: 'Search Live Information',
      naturalTranslation: 'Natural Translation',
      pronunciation: 'Pronunciation:',
      verifiedSources: 'Verified Sources & Places',
    },
  },
  bn: {
    common: {
      appName: 'LinguaConnect AI',
      loading: 'LinguaConnect AI চালু হচ্ছে...',
      online: 'অনলাইন',
      offline: 'অফলাইন',
      accept: 'গ্রহণ করুন',
      decline: 'প্রত্যাখ্যান',
      cancel: 'বাতিল',
      close: 'বন্ধ করুন',
      save: 'সংরক্ষণ করুন',
      saving: 'সংরক্ষণ হচ্ছে...',
      back: 'পিছনে',
      copy: 'কপি করুন',
      copied: 'কপি হয়েছে',
      retry: 'আবার চেষ্টা করুন',
      voice: 'ভয়েস',
      video: 'ভিডিও',
      signOut: 'লগ আউট',
      light: 'লাইট',
      dark: 'ডার্ক',
      uiLanguageLabel: 'ওয়েবসাইটের ভাষা',
      bangla: 'বাংলা (Bangla)',
      indonesian: 'ইন্দোনেশিয়ান (Bahasa Indonesia)',
      english: 'English',
      swap: 'বদলান',
      open: 'খুলুন',
    },
    nav: {
      home: 'হোম',
      dashboard: 'ড্যাশবোর্ড',
      friends: 'বন্ধুরা',
      myProfile: 'আমার প্রোফাইল',
      languages: 'ভাষা',
      history: 'কল হিস্ট্রি',
      calls: 'কলসমূহ',
      settings: 'সেটিংস',
      about: 'সম্পর্কে',
      notifications: 'নোটিফিকেশন',
      studioReady: 'সিগন্যালিং প্রস্তুত',
      connecting: 'সংযুক্ত হচ্ছে...',
      activeCallBanner: 'চলমান কল:',
      returnToCall: 'কলে ফিরে যান',
    },
    splash: {
      signIn: 'লগইন করুন',
      getStarted: 'শুরু করুন',
      architecture: 'আর্কিটেকচার',
      openStudio: 'স্টুডিও খুলুন',
      gmailLogin: 'লগইন',
      badge: 'বাংলা ↔ Bahasa Indonesia · রিয়েল-টাইম ভয়েস ও ভিডিও অনুবাদ',
      heroTitle: 'আপনার নিজের ভাষায় কথা বলুন, অপর প্রান্ত শুনবে তাদের ভাষায়।',
      heroSubtitle:
        'LinguaConnect AI আলাদা দুই-মুখী Gemini Live অডিও স্ট্রিম, লাইভ দ্বিভাষিক সাবটাইটেল এবং তাৎক্ষণিক ফ্রেন্ড কলিংয়ের মাধ্যমে বাংলা ও ইন্দোনেশিয়ান ভাষাভাষীদের সরাসরি সংযুক্ত করে।',
      enterStudio: 'কল স্টুডিওতে প্রবেশ করুন',
      continueWithGmail: 'লগইন / অ্যাকাউন্ট খুলুন',
      createProfileUrl: 'প্রোফাইল লিংক তৈরি করুন',
      dualStreamsTitle: 'আলাদা অডিও স্ট্রিম',
      dualStreamsDesc: 'কোনো ইকো বা লুপ নেই',
      webrtcTitle: 'WebRTC এইচডি',
      webrtcDesc: 'দ্রুত পিয়ার-টু-পিয়ার ভিডিও',
      privateCallsTitle: 'সুরক্ষিত কল',
      privateCallsDesc: 'অডিও রেকর্ড করা হয় না',
      previewLabel: 'লাইভ দ্বিভাষিক সাবটাইটেল প্রিভিউ',
      dhakaTitle: 'ঢাকা · বাংলা (Bangla)',
      dhakaDesc: 'স্বাভাবিক বাংলা উচ্চারণ',
      jakartaTitle: 'জাকার্তা · Bahasa Indonesia',
      jakartaDesc: 'তাৎক্ষণিক ইন্দোনেশিয়ান ভয়েস',
      footerNote: 'LinguaConnect AI · শুধুমাত্র যাচাইকৃত অ্যাকাউন্ট',
      aboutPrivacy: 'তথ্য ও গোপনীয়তা',
      loginLink: 'লগইন',
    },
    auth: {
      backToWelcome: 'হোমে ফিরে যান',
      backToSignIn: 'লগইনে ফিরে যান',
      loginTitle: 'LinguaConnect AI-তে লগইন করুন',
      loginSubtitle: 'সুরক্ষিত Firebase প্রমাণীকরণ · রিয়েল-টাইম কলিং',
      loginDesc:
        'আপনার ইমেইল ও পাসওয়ার্ড অথবা যাচাইকৃত Google অ্যাকাউন্ট দিয়ে লগইন করে বাংলা ↔ ইন্দোনেশিয়ান লাইভ ভয়েস অনুবাদ কল শুরু করুন।',
      chooseWebsiteLanguage: 'ওয়েবসাইটের ভাষা বেছে নিন',
      emailTab: 'ইমেইল ও পাসওয়ার্ড',
      googleTab: 'Google / Gmail',
      emailLabel: 'ইমেইল ঠিকানা',
      passwordLabel: 'পাসওয়ার্ড',
      displayNameLabel: 'পুরো নাম',
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড',
      namePlaceholder: 'আপনার নাম লিখুন',
      signInEmailBtn: 'ইমেইল দিয়ে লগইন করুন',
      signingIn: 'লগইন হচ্ছে...',
      signUpEmailBtn: 'নতুন অ্যাকাউন্ট তৈরি করুন',
      creatingAccount: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
      forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      resetSent: 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।',
      orContinueWith: 'অথবা Google দিয়ে লগইন করুন',
      signInGoogleBtn: 'Google দিয়ে লগইন করুন',
      continueGoogleBtn: 'Google দিয়ে চালিয়ে যান',
      oauthNoticeTitle: 'Google লগইন টেস্টিং মোড সতর্কতা',
      oauthNoticeBody:
        'যদি Google "Error 403: access_denied" দেখায়, তবে Google Cloud Console-এর OAuth Consent Screen-এ এই জিমেইলটি Test users হিসেবে যোগ করুন অথবা উপরের ইমেইল ও পাসওয়ার্ড ব্যবহার করে লগইন করুন।',
      verifyTitle: 'আপনার ইমেইল যাচাই করুন',
      verifyBody:
        'আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে ইমেইল যাচাই করুন এবং নিচের বোতামে ক্লিক করুন।',
      verifyCheckBtn: 'আমি ইমেইল যাচাই করেছি — এগিয়ে যান',
      verifyResendBtn: 'আবার ভেরিফিকেশন ইমেইল পাঠান',
      verifySignOutBtn: 'অন্য অ্যাকাউন্ট ব্যবহার করুন',
      featureFriends: 'জিমেইল বা Google Contacts থেকে বন্ধুদের যোগ করুন',
      featurePush: 'ইনকামিং কল ও ফ্রেন্ড রিকোয়েস্টের তাৎক্ষণিক ওয়েব নোটিফিকেশন',
      featureSecurity: 'Firebase Auth ও সুরক্ষিত Firestore নিয়ম দ্বারা পরিচালিত',
      noAccountYet: 'নতুন ব্যবহারকারী?',
      createAccountLink: 'নতুন অ্যাকাউন্ট খুলুন',
      alreadyHaveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?',
      signInLink: 'লগইন করুন',
      signupTitle: 'আপনার LinguaConnect প্রোফাইল তৈরি করুন',
      signupSubtitle: 'ওয়েবসাইটের ভাষা, আপনার কথ্য ভাষা ও ইউনিক প্রোফাইল লিংক নির্বাচন করুন।',
      primarySpokenLang: 'আপনার প্রধান কথ্য ভাষা',
      banglaSub: 'বাংলা (Bengali)',
      indonesianSub: 'Bahasa Indonesia',
      handleLabel: 'ইউনিক প্রোফাইল হ্যান্ডেল (ঐচ্ছিক)',
      handleHint: 'প্রতিটি ব্যবহারকারী স্বয়ংক্রিয়ভাবে /profile/[uid] এবং /u/[handle] লিংক পান।',
    },
    dashboard: {
      enablePushTitle: 'ইনকামিং কলের জন্য ওয়েব পুশ নোটিফিকেশন চালু করুন',
      enablePushDesc:
        'বন্ধু কল করলে বা রিকোয়েস্ট পাঠালে Accept এবং Decline বাটনসহ তাৎক্ষণিক ব্রাউজার নোটিফিকেশন পান।',
      allowNotifications: 'নোটিফিকেশন অনুমতি দিন',
      statusOnline: 'স্ট্যাটাস: অনলাইন',
      statusOffline: 'স্ট্যাটাস: অফলাইন',
      uniqueProfileUrl: 'আপনার ইউনিক শেয়ারযোগ্য প্রোফাইল লিংক',
      copyLink: 'লিংক কপি করুন',
      activeBidirectional: 'সক্রিয় দুই-মুখী অনুবাদ',
      youSpeakPrefix: 'আপনার ভাষা:',
      voicePersonaPrefix: 'ভয়েস স্টাইল:',
      configure: 'পরিবর্তন করুন',
      addFriendGmail: 'ফ্রেন্ড রিকোয়েস্ট পাঠান',
      aiPhrase: 'এআই বাক্য সহায়ক',
      quickSendTitle: 'ফ্রেন্ড রিকোয়েস্ট পাঠান',
      quickSendPlaceholder: 'friend@gmail.com অথবা @হ্যান্ডেল লিখুন...',
      incomingRequests: 'আগত ফ্রেন্ড রিকোয়েস্ট (Accept করুন)',
      incomingEmpty: 'এই মুহূর্তে কোনো নতুন ফ্রেন্ড রিকোয়েস্ট আসেনি। কেউ পাঠালে সাথে সাথে এখানে দেখা যাবে।',
      manageFriendsBtn: 'বন্ধু ও রিকোয়েস্ট পেজ',
      friendsDirectory: 'বন্ধু ও সরাসরি কলিং',
      friendsSubtitle: 'যাচাইকৃত বন্ধু · সরাসরি অনুবাদসহ ভয়েস বা ভিডিও কল করুন',
      invite: 'আমন্ত্রণ',
      noFriendsTitle: 'এখনো কোনো বন্ধু যুক্ত নেই',
      noFriendsDesc:
        'বন্ধুর ইমেইল বা @হ্যান্ডেল দিয়ে রিকোয়েস্ট পাঠান, Google Contacts থেকে আনুন অথবা প্রোফাইল লিংক শেয়ার করুন।',
      copyMyLink: 'আমার প্রোফাইল লিংক কপি করুন',
      pendingSent: 'পাঠানো অপেক্ষমাণ রিকোয়েস্ট',
      waitingFor: 'অনুমোদনের অপেক্ষায়:',
      recentCalls: 'সাম্প্রতিক কলসমূহ',
      viewAll: 'সব দেখুন',
      noCallsYet: 'এখনো কোনো কল রেকর্ড নেই। যুক্ত কোনো বন্ধুকে ভয়েস বা ভিডিও কল দিন।',
    },
    languages: {
      title: 'ভাষা ও অনুবাদ স্টুডিও',
      subtitle: 'আপনার কথ্য ভাষা ঠিক করুন, ১০০% লাইভ ভয়েস ট্রান্সলেশন টেস্ট করুন এবং ভয়েস শুনুন।',
      spokenLangTitle: 'আপনার কথ্য ভাষা',
      spokenLangDesc:
        'আপনি বাংলায় কথা বললে অপর প্রান্ত ইন্দোনেশিয়ান শুনবে। আপনি ইন্দোনেশিয়ান বললে অপর প্রান্ত বাংলা শুনবে।',
      bnDesc: 'আপনি বলবেন বাংলা → বন্ধু শুনবে Bahasa Indonesia',
      idDesc: 'আপনি বলবেন Bahasa Indonesia → বন্ধু শুনবে বাংলা',
      autoVerifyTitle: 'স্বয়ংক্রিয় ভাষা যাচাইকরণ',
      autoVerifyDesc: 'কথার মাঝখানে ভাষা বদলালে ম্যানুয়ালি পরিবর্তন করার সুবিধা চালু রাখুন।',
      voicePersonaTitle: 'ভয়েস প্রিভিউ ও স্টাইল',
      voicePersonaDesc: 'Gemini Flash TTS দিয়ে স্বাভাবিক বাংলা বা ইন্দোনেশিয়ান কণ্ঠস্বর পরীক্ষা করুন।',
      preview: 'শুনুন',
      fidelityTitle: 'বাংলা ও ইন্দোনেশিয়ান ভাষার নির্ভুলতা',
      fidelityDesc:
        'LinguaConnect AI সরাসরি BCP-47 কোড (bn ও id) ব্যবহার করে যাতে বাংলা কখনো হিন্দিতে বা ইন্দোনেশিয়ান কখনো মালয় ভাষায় মিশে না যায়।',
      savePrefs: 'ভাষা সেটিংস সংরক্ষণ করুন',
      liveTestTitle: '১০০% লাইভ ভয়েস ট্রান্সলেশন মাইক টেস্ট',
      liveTestDesc:
        'এখনই মাইক্রোফোনে কথা বলে রিয়েল-টাইম Gemini Live ভয়েস অনুবাদ ও সাবটাইটেল যাচাই করুন।',
      startLiveTest: 'লাইভ ভয়েস টেস্ট শুরু করুন',
      stopLiveTest: 'টেস্ট বন্ধ করুন',
      liveTestListening: 'কথা শুনছে ও অনুবাদ করছে...',
      liveTestConnecting: 'Gemini Live-এর সাথে সংযুক্ত হচ্ছে...',
      liveTestIdle: 'শুরু করুন বাটনে চাপ দিয়ে মাইক্রোফোনে স্বাভাবিকভাবে কথা বলুন।',
      testDirection: 'অনুবাদের দিক',
    },
    call: {
      noActiveVoice: 'কোনো সক্রিয় ভয়েস কল নেই',
      noActiveVideo: 'কোনো সক্রিয় ভিডিও কল নেই',
      returnDashboard: 'ড্যাশবোর্ডে ফিরে যান',
      voiceCall: 'ভয়েস কল',
      videoCall: 'ভিডিও কল',
      aiTranslation: 'এআই অনুবাদ',
      ringingPeer: 'রিং হচ্ছে...',
      callingPeer: 'কল করা হচ্ছে',
      waitingPeerVideo: 'অপর প্রান্তের ভিডিওর জন্য অপেক্ষা করা হচ্ছে...',
      secureAudio: 'নিরাপদ দুই-মুখী অডিও',
      micMuted: 'মাইক্রোফোন মিউট করা',
      capturingPcm: '১৬kHz অডিও প্রবাহিত হচ্ছে',
      youSpeak: 'আপনি বলছেন',
      partnerHears: 'বন্ধু শুনছে',
      switchLabel: 'বদলান',
      translatedVoice: 'অনূদিত ভয়েস',
      originalAudio: 'মূল কণ্ঠস্বর',
      liveCaptions: 'লাইভ দ্বিভাষিক সাবটাইটেল',
      liveCaptionsDesc: 'মূল কথার সাথে তাৎক্ষণিক অনূদিত লেখা',
      aiSummary: 'এআই সারাংশ',
      summarizing: 'তৈরি হচ্ছে...',
      callSummary: 'কলের সারাংশ',
      captionsOn: 'সাবটাইটেল চালু',
      captionsOff: 'সাবটাইটেল বন্ধ',
      captionsTurnedOff: 'লাইভ সাবটাইটেল বন্ধ আছে।',
      listeningSpeech: 'বাংলা বা ইন্দোনেশিয়ান কথার জন্য অপেক্ষা করছে...',
      captionsHint: 'কথা বলার সাথে সাথে এখানে মূল ও অনূদিত সাবটাইটেল দেখা যাবে।',
      mute: 'মিউট',
      unmute: 'আনমিউট',
      translationOn: 'অনুবাদ চালু',
      translationOff: 'অনুবাদ বন্ধ',
      translateOnShort: 'অনুবাদ চালু',
      translateOffShort: 'অনুবাদ বন্ধ',
      phrases: 'বাক্য সহায়ক',
      endCall: 'কল কাটুন',
      endShort: 'শেষ',
      cameraOff: 'ক্যামেরা বন্ধ',
      camOff: 'ক্যামেরা বন্ধ',
      camOn: 'ক্যামেরা চালু',
      audioTranslated: 'অডিও: অনূদিত',
      audioOriginal: 'অডিও: মূল',
      incomingVoiceCall: 'ইনকামিং ভয়েস কল',
      incomingVideoCall: 'ইনকামিং ভিডিও কল',
      aiTranslationLabel: 'এআই অনুবাদ',
    },
    history: {
      title: 'কল হিস্ট্রি',
      subtitle: 'শুধুমাত্র কলের তথ্য Firestore-এ সংরক্ষিত থাকে। অডিও বা ভিডিও কখনো রেকর্ড হয় না।',
      zeroRecording: 'কোনো মিডিয়া রেকর্ডিং নেই',
      filterAll: 'সবগুলো',
      filterVoice: 'ভয়েস',
      filterVideo: 'ভিডিও',
      filterMissed: 'মিসড',
      searchPlaceholder: 'নাম দিয়ে খুঁজুন...',
      noMatches: 'কোনো কল পাওয়া যায়নি',
      noMatchesDesc: 'আপনার করা বা পাওয়া কলগুলোর সময়কাল ও ভাষা এখানে দেখা যাবে।',
      outgoing: 'আউটগোয়িং',
      incoming: 'ইনকামিং',
      summaryPrefix: 'সারাংশ:',
    },
    settings: {
      title: 'সেটিংস ও অ্যাকাউন্ট',
      subtitle: 'ওয়েবসাইটের ভাষা, প্রোফাইল লিংক, অনুবাদ ও নোটিফিকেশন নিয়ন্ত্রণ করুন।',
      lightTheme: 'লাইট থিম',
      darkTheme: 'ডার্ক থিম',
      websiteLangTitle: 'ওয়েবসাইটের ভাষা',
      websiteLangDesc: 'পুরো ওয়েবসাইটের সব লেখা ও বাটন তাৎক্ষণিকভাবে পরিবর্তন করুন।',
      profileTitle: 'প্রোফাইল ও ইউনিক লিংক',
      displayName: 'নাম',
      uniqueHandle: 'ইউনিক প্রোফাইল হ্যান্ডেল',
      bioLabel: 'পরিচিতি / বায়ো',
      bioPlaceholder: 'ঢাকা ↔ জাকার্তা কলের জন্য উপলব্ধ...',
      saveProfile: 'প্রোফাইল সংরক্ষণ করুন',
      prefsTitle: 'অনুবাদ, অডিও ও গোপনীয়তা',
      autoStartTitle: 'স্বয়ংক্রিয় রিয়েল-টাইম অনুবাদ শুরু',
      autoStartDesc: 'কল যুক্ত হওয়ার সাথে সাথে দুই-মুখী ভয়েস অনুবাদ চালু করুন।',
      defaultTranslatedTitle: 'ডিফল্টভাবে অনূদিত ভয়েস শোনা',
      defaultTranslatedDesc: 'ইকো এড়াতে অনুবাদ চলাকালীন অপর প্রান্তের মূল ভয়েস মিউট রাখুন।',
      enableCaptionsTitle: 'লাইভ দ্বিভাষিক সাবটাইটেল দেখান',
      enableCaptionsDesc: 'কল চলাকালীন বাংলা ও ইন্দোনেশিয়ান সাবটাইটেল দেখান।',
      noStorageNote: 'অডিও ও ভিডিও স্ট্রিম রিয়েল-টাইমে চলে এবং Firestore-এ সংরক্ষিত হয় না।',
      diagnosticsTitle: 'অনুমতি ও হার্ডওয়্যার পরীক্ষা',
      webPushTitle: 'ওয়েব পুশ কল নোটিফিকেশন',
      browserPerm: 'ব্রাউজার অনুমতি:',
      sendTestNotif: 'টেস্ট নোটিফিকেশন পাঠান',
      enableNotifs: 'নোটিফিকেশন চালু করুন',
      hardwareTitle: 'মাইক্রোফোন ও ক্যামেরা পরীক্ষা',
      hardwareIdle: 'কলে যোগ দেওয়ার আগে মাইক ও ক্যামেরা পরীক্ষা করুন।',
      testMicCam: 'মাইক ও ক্যামেরা টেস্ট করুন',
      stopTest: 'টেস্ট বন্ধ করুন',
      signedInAs: 'লগইন করা ইমেইল:',
    },
    about: {
      title: 'LinguaConnect AI সম্পর্কে',
      subtitle: 'রিয়েল-টাইম বাংলা ↔ ইন্দোনেশিয়ান ভয়েস ও ভিডিও অনুবাদ প্ল্যাটফর্ম।',
      howItWorksTitle: 'দুই-মুখী অনুবাদ যেভাবে কাজ করে',
      dualStreamTitle: 'আলাদা অডিও স্ট্রিম',
      dualStreamDesc:
        'প্রতিটি ব্যবহারকারীর ১৬kHz মাইক্রোফোন অডিও আলাদা Gemini Live Translation সেশনে যায় এবং ২৪kHz অনূদিত কণ্ঠ শুধুমাত্র অপর প্রান্তের কাছে পৌঁছে।',
      webrtcTitle: 'নিরবচ্ছিন্ন WebRTC ভিডিও',
      webrtcDesc:
        'পিয়ার-টু-পিয়ার WebRTC এইচডি ভিডিও ও ব্যাকআপ অডিও বহন করে যাতে নেটওয়ার্কে সাময়িক সমস্যা হলেও কল বিচ্ছিন্ন না হয়।',
      securityTitle: 'গোপনীয়তা, নিরাপত্তা ও ভাষার নির্ভুলতা',
      zeroDemoTitle: 'কোনো ভুয়া বা ডেমো অ্যাকাউন্ট নেই:',
      zeroDemoDesc:
        'সকল ব্যবহারকারী যাচাইকৃত ইমেইল বা Google অ্যাকাউন্টে লগইন করেন এবং ইমেইল হ্যাশ দিয়ে বন্ধু খোঁজা হয়।',
      noRecordTitle: 'অডিও/ভিডিও রেকর্ড করা হয় না:',
      noRecordDesc: 'কলের অডিও বা ভিডিও সংরক্ষণ করা হয় না; শুধু কলের সময় ও বিবরণ থাকে।',
      fidelityTitle: 'নির্ভুল বাংলা ও ইন্দোনেশিয়ান:',
      fidelityDesc: 'BCP-47 কোড bn এবং id নির্দিষ্ট করা থাকায় উচ্চারণ ও ব্যাকরণ সঠিক থাকে।',
      readinessTitle: 'সার্ভিস অবস্থা',
      backendServer: 'ব্যাকএন্ড সার্ভার:',
      geminiLive: 'Gemini Live API:',
      firebaseProject: 'Firebase প্রজেক্ট:',
      ready: 'প্রস্তুত',
      checking: 'যাচাই হচ্ছে...',
      configured: 'সক্রিয়',
      missingKey: 'কী অনুপস্থিত',
      connected: 'সংযুক্ত',
      pending: 'অপেক্ষমাণ',
    },
    profile: {
      signInPromptTitle: 'এই প্রোফাইল দেখতে লগইন করুন',
      signInPromptDesc: 'প্রোফাইল দেখতে, ফ্রেন্ড রিকোয়েস্ট পাঠাতে বা কল করতে আপনার অ্যাকাউন্টে লগইন করুন।',
      loading: 'প্রোফাইল লোড হচ্ছে...',
      notFoundTitle: 'প্রোফাইল পাওয়া যায়নি',
      notFoundDesc: 'এই নামে কোনো প্রোফাইল পাওয়া যায়নি:',
      backDashboard: 'ড্যাশবোর্ডে ফিরে যান',
      editMyProfile: 'প্রোফাইল সম্পাদনা করুন',
      voiceCall: 'ভয়েস কল',
      videoCall: 'ভিডিও কল',
      friendReqSent: 'ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে',
      respondDashboard: 'ড্যাশবোর্ডে উত্তর দিন',
      sendFriendReq: 'ফ্রেন্ড রিকোয়েস্ট পাঠান',
      shareableLinks: 'ইউনিক প্রোফাইল লিংকসমূহ',
      copyUidUrl: 'UID লিংক কপি করুন',
      copyHandleUrl: 'হ্যান্ডেল লিংক কপি করুন',
    },
    notificationsDrawer: {
      title: 'নোটিফিকেশন ও রিকোয়েস্ট',
      pendingRequests: 'আগত ফ্রেন্ড রিকোয়েস্ট',
      incomingEmpty: 'এখনো কোনো আগত ফ্রেন্ড রিকোয়েস্ট নেই।',
      openFriendsPage: 'রিকোয়েস্ট পাঠান বা দেখুন',
      recentAlerts: 'সাম্প্রতিক নোটিফিকেশন',
      empty: 'এখনো কোনো নোটিফিকেশন নেই।',
      markRead: 'পঠিত চিহ্নিত করুন',
      viewProfile: 'প্রোফাইল দেখুন',
    },
    addFriend: {
      title: 'ফ্রেন্ড রিকোয়েস্ট পাঠান',
      enterGmail: 'বন্ধুর নিবন্ধিত ইমেইল অথবা @হ্যান্ডেল লিখুন',
      find: 'খুঁজুন',
      connectedOrPending: 'যুক্ত / অপেক্ষমাণ',
      alreadySentYouHint: 'আপনাকে রিকোয়েস্ট পাঠিয়েছেন — নিচ থেকে গ্রহণ করুন:',
      sendRequest: 'রিকোয়েস্ট পাঠান',
      sending: 'পাঠানো হচ্ছে...',
      notRegisteredTitle: 'এখনো LinguaConnect AI-তে নিবন্ধিত নন।',
      notRegisteredDesc: 'তাদের সাথে আপনার প্রোফাইল লিংক শেয়ার করুন যাতে তারা আগে অ্যাকাউন্ট খুলতে পারেন।',
      copyShareLink: 'প্রোফাইল লিংক কপি করুন',
      importContactsTitle: 'Google Contacts থেকে আনুন',
      importContactsDesc: 'আপনার Google Contacts লোড করে বন্ধুদের খুঁজুন।',
      loadContacts: 'কন্টাক্ট লোড করুন',
      refreshContacts: 'রিফ্রেশ করুন',
      noContacts: 'কোনো ইমেইলযুক্ত কন্টাক্ট পাওয়া যায়নি।',
      checkAndInvite: 'যাচাই ও আমন্ত্রণ',
    },
    friendsPage: {
      title: 'বন্ধু ও ফ্রেন্ড রিকোয়েস্ট',
      subtitle: 'ইমেইল বা @হ্যান্ডেল দিয়ে ফ্রেন্ড রিকোয়েস্ট পাঠান, আসা রিকোয়েস্ট Accept করুন এবং সরাসরি কল করুন।',
      sendCardTitle: 'নতুন ফ্রেন্ড রিকোয়েস্ট পাঠান',
      sendCardDesc: 'নিবন্ধিত যেকোনো ব্যবহারকারীর Gmail/ইমেইল ঠিকানা বা @হ্যান্ডেল লিখে খুঁজুন ও রিকোয়েস্ট পাঠান।',
      sendPlaceholder: 'friend@gmail.com অথবা @হ্যান্ডেল',
      sendBtn: 'রিকোয়েস্ট পাঠান',
      incomingTitle: 'আগত ফ্রেন্ড রিকোয়েস্ট (Accept করুন)',
      incomingDesc: 'যারা আপনাকে বন্ধু হতে চান তাদের রিকোয়েস্ট এখান থেকে Accept বা বাতিল করুন।',
      incomingEmpty: 'এখনো কোনো আগত ফ্রেন্ড রিকোয়েস্ট নেই।',
      outgoingTitle: 'পাঠানো ফ্রেন্ড রিকোয়েস্ট (অপেক্ষমাণ)',
      outgoingEmpty: 'আপনার পাঠানো কোনো রিকোয়েস্ট অপেক্ষমাণ নেই।',
      cancelRequest: 'বাতিল করুন',
      connectedTitle: 'যুক্ত বন্ধুরা',
      connectedEmpty: 'রিকোয়েস্ট Accept করার পর বন্ধুরা সরাসরি ভয়েস ও ভিডিও কলের জন্য এখানে দেখা যাবে।',
      viewProfile: 'প্রোফাইল',
    },
    phraseDrawer: {
      title: 'স্মার্ট বাক্য ও প্রাসঙ্গিক সহায়ক',
      tabPhrase: 'দ্রুত অনুবাদ',
      tabNuance: 'গভীর বিশ্লেষণ',
      tabContext: 'সার্চ ও ম্যাপস',
      googleSearch: 'Google Search',
      googleMaps: 'Google Maps',
      translateBtn: 'তাৎক্ষণিক অনুবাদ করুন',
      nuanceBtn: 'সাংস্কৃতিক ও ব্যাকরণ বিশ্লেষণ করুন',
      mapsBtn: 'ম্যাপে স্থান খুঁজুন',
      searchBtn: 'লাইভ তথ্য খুঁজুন',
      naturalTranslation: 'স্বাভাবিক অনুবাদ',
      pronunciation: 'উচ্চারণ:',
      verifiedSources: 'যাচাইকৃত সূত্র ও স্থান',
    },
  },
  id: {
    common: {
      appName: 'LinguaConnect AI',
      loading: 'Memulai LinguaConnect AI...',
      online: 'Online',
      offline: 'Offline',
      accept: 'Terima',
      decline: 'Tolak',
      cancel: 'Batal',
      close: 'Tutup',
      save: 'Simpan',
      saving: 'Menyimpan...',
      back: 'Kembali',
      copy: 'Salin',
      copied: 'Tersalin',
      retry: 'Coba Lagi',
      voice: 'Suara',
      video: 'Video',
      signOut: 'Keluar',
      light: 'Terang',
      dark: 'Gelap',
      uiLanguageLabel: 'Bahasa Situs',
      bangla: 'Bangla (বাংলা)',
      indonesian: 'Bahasa Indonesia',
      english: 'English',
      swap: 'Tukar',
      open: 'Buka',
    },
    nav: {
      home: 'Beranda',
      dashboard: 'Dasbor',
      friends: 'Teman',
      myProfile: 'Profil Saya',
      languages: 'Bahasa',
      history: 'Riwayat',
      calls: 'Panggilan',
      settings: 'Pengaturan',
      about: 'Tentang',
      notifications: 'Notifikasi',
      studioReady: 'Sinyal Siap',
      connecting: 'Menghubungkan...',
      activeCallBanner: 'Panggilan aktif dengan',
      returnToCall: 'Kembali ke Panggilan',
    },
    splash: {
      signIn: 'Masuk',
      getStarted: 'Mulai',
      architecture: 'Arsitektur',
      openStudio: 'Buka Studio',
      gmailLogin: 'Masuk',
      badge: 'Bangla (বাংলা) ↔ Bahasa Indonesia · Terjemahan Suara Real-Time',
      heroTitle: 'Berbicara alami dalam bahasa Anda. Terdengar dalam bahasa mereka.',
      heroSubtitle:
        'LinguaConnect AI menghubungkan panggilan suara dan video langsung antara penutur bahasa Bangla dan Indonesia melalui aliran terjemahan Gemini Live dua arah yang terisolasi.',
      enterStudio: 'Masuk ke Studio Panggilan',
      continueWithGmail: 'Masuk / Daftar',
      createProfileUrl: 'Buat URL Profil',
      dualStreamsTitle: 'Aliran Ganda',
      dualStreamsDesc: 'Bebas gema dan umpan balik',
      webrtcTitle: 'WebRTC HD',
      webrtcDesc: 'Video peer tangguh & cadangan',
      privateCallsTitle: 'Panggilan Privat',
      privateCallsDesc: 'Tanpa rekaman audio default',
      previewLabel: 'Pratinjau Teks Terjemahan Langsung',
      dhakaTitle: 'Dhaka · বাংলা (Bangla)',
      dhakaDesc: 'Pelafalan Bengali alami',
      jakartaTitle: 'Jakarta · Bahasa Indonesia',
      jakartaDesc: 'Suara Indonesia instan',
      footerNote: 'LinguaConnect AI · Akun Terverifikasi',
      aboutPrivacy: 'Tentang & Privasi',
      loginLink: 'Masuk',
    },
    auth: {
      backToWelcome: 'Kembali ke Beranda',
      backToSignIn: 'Kembali ke Masuk',
      loginTitle: 'Masuk ke LinguaConnect AI',
      loginSubtitle: 'Autentikasi Firebase Aman · Panggilan real-time',
      loginDesc:
        'Masuk dengan Email & Kata Sandi atau akun Google terverifikasi untuk menelepon teman dengan terjemahan suara Bangla ↔ Indonesia langsung.',
      chooseWebsiteLanguage: 'Pilih Bahasa Tampilan Situs',
      emailTab: 'Email & Sandi',
      googleTab: 'Google / Gmail',
      emailLabel: 'Alamat Email',
      passwordLabel: 'Kata Sandi',
      displayNameLabel: 'Nama Lengkap',
      emailPlaceholder: 'anda@contoh.com',
      passwordPlaceholder: 'Minimal 6 karakter',
      namePlaceholder: 'Nama lengkap Anda',
      signInEmailBtn: 'Masuk dengan Email',
      signingIn: 'Sedang masuk...',
      signUpEmailBtn: 'Buat Akun',
      creatingAccount: 'Membuat akun...',
      forgotPassword: 'Lupa kata sandi?',
      resetSent: 'Tautan atur ulang kata sandi telah dikirim ke email Anda.',
      orContinueWith: 'atau lanjutkan dengan Google',
      signInGoogleBtn: 'Masuk dengan Google',
      continueGoogleBtn: 'Lanjutkan dengan Google',
      oauthNoticeTitle: 'Pemberitahuan Mode Uji Google Sign-In',
      oauthNoticeBody:
        'Jika Google menampilkan "Error 403: access_denied", tambahkan alamat Gmail ke Test users di Google Cloud Console atau masuk menggunakan Email & Kata Sandi di atas.',
      verifyTitle: 'Verifikasi Alamat Email Anda',
      verifyBody:
        'Tautan verifikasi telah dikirim ke kotak masuk Anda. Klik tautan tersebut lalu tekan tombol Lanjutkan di bawah ini.',
      verifyCheckBtn: 'Saya Sudah Verifikasi — Lanjutkan',
      verifyResendBtn: 'Kirim Ulang Email Verifikasi',
      verifySignOutBtn: 'Gunakan Akun Lain',
      featureFriends: 'Tambah teman langsung lewat email atau Google Contacts',
      featurePush: 'Notifikasi Web instan untuk panggilan suara & video masuk',
      featureSecurity: 'Diamankan oleh Firebase Authentication & aturan Firestore ketat',
      noAccountYet: 'Baru di LinguaConnect AI?',
      createAccountLink: 'Buat akun baru',
      alreadyHaveAccount: 'Sudah punya akun?',
      signInLink: 'Masuk',
      signupTitle: 'Buat Profil LinguaConnect Anda',
      signupSubtitle: 'Pilih bahasa situs, bahasa lisan utama, dan tautan profil unik Anda.',
      primarySpokenLang: 'Bahasa Lisan Utama Anda',
      banglaSub: 'বাংলা (Bengali)',
      indonesianSub: 'Bahasa Indonesia',
      handleLabel: 'Handle Unik (Opsional)',
      handleHint: 'Setiap pengguna otomatis mendapatkan tautan /profile/[uid] dan /u/[handle].',
    },
    dashboard: {
      enablePushTitle: 'Aktifkan Notifikasi Push Web untuk Panggilan Masuk',
      enablePushDesc:
        'Terima peringatan browser instan dengan tombol Terima dan Tolak saat teman menelepon Anda.',
      allowNotifications: 'Izinkan Notifikasi',
      statusOnline: 'Status: Online',
      statusOffline: 'Status: Offline',
      uniqueProfileUrl: 'URL Profil Unik Anda',
      copyLink: 'Salin Tautan',
      activeBidirectional: 'Terjemahan Dua Arah Aktif',
      youSpeakPrefix: 'Anda berbicara',
      voicePersonaPrefix: 'Persona suara',
      configure: 'Atur',
      addFriendGmail: 'Kirim Permintaan Teman',
      aiPhrase: 'Frasa AI',
      quickSendTitle: 'Kirim Permintaan Pertemanan',
      quickSendPlaceholder: 'Masukkan friend@gmail.com atau @handle...',
      incomingRequests: 'Permintaan Pertemanan Masuk',
      incomingEmpty: 'Belum ada permintaan pertemanan masuk saat ini.',
      manageFriendsBtn: 'Halaman Teman & Permintaan',
      friendsDirectory: 'Teman & Panggilan Langsung',
      friendsSubtitle: 'Kontak terverifikasi · Klik Suara atau Video untuk menelepon dengan terjemahan langsung',
      invite: 'Undang',
      noFriendsTitle: 'Belum ada teman terhubung',
      noFriendsDesc:
        'Undang teman menggunakan alamat email atau @handle, impor dari Google Contacts, atau bagikan tautan profil Anda.',
      copyMyLink: 'Salin Tautan Profil Saya',
      pendingSent: 'Permintaan Terkirim Menunggu',
      waitingFor: 'Menunggu persetujuan:',
      recentCalls: 'Panggilan Terbaru',
      viewAll: 'Lihat Semua',
      noCallsYet: 'Belum ada panggilan tercatat. Mulai panggilan suara atau video dengan teman.',
    },
    languages: {
      title: 'Studio Bahasa & Terjemahan',
      subtitle: 'Atur bahasa lisan Anda, uji terjemahan suara Gemini Live 100%, dan pratinjau suara.',
      spokenLangTitle: 'Bahasa Lisan Anda',
      spokenLangDesc:
        'Saat Anda berbicara Bahasa Indonesia, lawan bicara mendengar Bangla. Saat berbicara Bangla, lawan bicara mendengar Bahasa Indonesia.',
      bnDesc: 'Anda bicara Bangla → Lawan bicara mendengar Bahasa Indonesia',
      idDesc: 'Anda bicara Bahasa Indonesia → Lawan bicara mendengar বাংলা (Bangla)',
      autoVerifyTitle: 'Verifikasi Bahasa Otomatis',
      autoVerifyDesc: 'Pantau input suara dan izinkan pergantian bahasa manual saat panggilan.',
      voicePersonaTitle: 'Pratinjau & Persona Suara',
      voicePersonaDesc: 'Uji sintesis suara Bangla atau Indonesia alami menggunakan Gemini Flash TTS.',
      preview: 'Pratinjau',
      fidelityTitle: 'Isolasi Linguistik Bangla & Indonesia',
      fidelityDesc:
        'LinguaConnect AI mengunci target bahasa BCP-47 (bn untuk Bangla, id untuk Bahasa Indonesia) agar Bangla tidak tercampur Hindi dan Indonesia tidak bergeser ke Melayu.',
      savePrefs: 'Simpan Preferensi Bahasa',
      liveTestTitle: 'Uji Mikrofon Terjemahan Suara Langsung 100%',
      liveTestDesc:
        'Berbicaralah ke mikrofon Anda sekarang untuk menguji terjemahan suara-ke-suara Gemini Live secara langsung.',
      startLiveTest: 'Mulai Uji Suara Langsung',
      stopLiveTest: 'Hentikan Uji Suara',
      liveTestListening: 'Mendengarkan & menerjemahkan suara langsung...',
      liveTestConnecting: 'Menghubungkan ke Gemini Live Translation...',
      liveTestIdle: 'Tekan Mulai dan berbicaralah secara alami ke mikrofon.',
      testDirection: 'Arah Terjemahan',
    },
    call: {
      noActiveVoice: 'Tidak ada sesi panggilan suara aktif',
      noActiveVideo: 'Tidak ada sesi panggilan video aktif',
      returnDashboard: 'Kembali ke Dasbor',
      voiceCall: 'Panggilan Suara',
      videoCall: 'Panggilan Video',
      aiTranslation: 'Terjemahan AI',
      ringingPeer: 'Memanggil lawan bicara...',
      callingPeer: 'Memanggil',
      waitingPeerVideo: 'Menunggu video lawan bicara...',
      secureAudio: 'Audio dua arah aman',
      micMuted: 'Mikrofon Dibisukan',
      capturingPcm: 'Menangkap audio PCM 16kHz',
      youSpeak: 'Anda Bicara',
      partnerHears: 'Lawan Mendengar',
      switchLabel: 'Tukar',
      translatedVoice: 'Suara Terjemahan',
      originalAudio: 'Audio Asli',
      liveCaptions: 'Teks Dwibahasa Langsung',
      liveCaptionsDesc: 'Ucapan asli dipasangkan dengan hasil terjemahan langsung',
      aiSummary: 'Ringkasan AI',
      summarizing: 'Meringkas...',
      callSummary: 'Ringkasan Panggilan',
      captionsOn: 'Teks Aktif',
      captionsOff: 'Teks Mati',
      captionsTurnedOff: 'Teks langsung dimatikan.',
      listeningSpeech: 'Mendengarkan ucapan Bangla atau Indonesia...',
      captionsHint: 'Teks asli dan terjemahan muncul di sini saat Anda berbicara.',
      mute: 'Bisukan',
      unmute: 'Suarakan',
      translationOn: 'Terjemahan Aktif',
      translationOff: 'Terjemahan Mati',
      translateOnShort: 'Terjemahan On',
      translateOffShort: 'Terjemahan Off',
      phrases: 'Frasa',
      endCall: 'Akhiri Panggilan',
      endShort: 'Akhiri',
      cameraOff: 'Kamera Mati',
      camOff: 'Kam Mati',
      camOn: 'Kam Aktif',
      audioTranslated: 'Audio: Terjemahan',
      audioOriginal: 'Audio: Asli',
      incomingVoiceCall: 'Panggilan Suara Masuk',
      incomingVideoCall: 'Panggilan Video Masuk',
      aiTranslationLabel: 'Terjemahan AI',
    },
    history: {
      title: 'Riwayat Panggilan',
      subtitle: 'Metadata tersimpan aman di Firestore. Audio dan video panggilan tidak pernah direkam.',
      zeroRecording: 'Tanpa rekaman media',
      filterAll: 'Semua',
      filterVoice: 'Suara',
      filterVideo: 'Video',
      filterMissed: 'Tak Terjawab',
      searchPlaceholder: 'Cari peserta...',
      noMatches: 'Tidak ada catatan panggilan',
      noMatchesDesc: 'Panggilan yang Anda lakukan atau terima muncul di sini.',
      outgoing: 'Keluar',
      incoming: 'Masuk',
      summaryPrefix: 'Ringkasan:',
    },
    settings: {
      title: 'Pengaturan & Akun',
      subtitle: 'Kelola bahasa situs, tautan profil, preferensi terjemahan, perangkat keras, dan notifikasi.',
      lightTheme: 'Tema Terang',
      darkTheme: 'Tema Gelap',
      websiteLangTitle: 'Bahasa Antarmuka Situs',
      websiteLangDesc: 'Ubah semua menu, tombol, dan label di seluruh situs web secara langsung.',
      profileTitle: 'Profil & URL Unik',
      displayName: 'Nama Tampilan',
      uniqueHandle: 'Handle Profil Unik',
      bioLabel: 'Bio / Sapaan',
      bioPlaceholder: 'Tersedia untuk panggilan Dhaka ↔ Jakarta...',
      saveProfile: 'Simpan Profil',
      prefsTitle: 'Terjemahan, Audio & Privasi',
      autoStartTitle: 'Mulai Otomatis Terjemahan AI Real-Time',
      autoStartDesc: 'Aktifkan terjemahan suara dua arah otomatis saat panggilan tersambung.',
      defaultTranslatedTitle: 'Gunakan Suara Terjemahan secara Default',
      defaultTranslatedDesc: 'Bisukan audio asli lawan bicara saat suara terjemahan diputar agar tidak bergema.',
      enableCaptionsTitle: 'Aktifkan Teks Dwibahasa Langsung',
      enableCaptionsDesc: 'Tampilkan teks terjemahan Bangla dan Indonesia selama panggilan.',
      noStorageNote: 'Aliran audio dan video bersifat sementara real-time dan tidak pernah disimpan di Firestore.',
      diagnosticsTitle: 'Izin & Diagnostik',
      webPushTitle: 'Notifikasi Panggilan Push Web',
      browserPerm: 'Izin browser:',
      sendTestNotif: 'Kirim Notifikasi Uji',
      enableNotifs: 'Aktifkan Notifikasi',
      hardwareTitle: 'Pemeriksaan Mikrofon & Kamera',
      hardwareIdle: 'Verifikasi akses audio/video browser sebelum bergabung ke panggilan.',
      testMicCam: 'Uji Mik & Kamera',
      stopTest: 'Hentikan Uji',
      signedInAs: 'Masuk sebagai',
    },
    about: {
      title: 'Tentang LinguaConnect AI',
      subtitle: 'Studio komunikasi suara dan video real-time Bangla (বাংলা) ↔ Bahasa Indonesia.',
      howItWorksTitle: 'Cara Kerja Terjemahan Dua Arah',
      dualStreamTitle: 'Aliran Audio Ganda Terisolasi',
      dualStreamDesc:
        'Setiap peserta menangkap audio PCM 16kHz dan mengalirkannya ke sesi Gemini Live Translation independen. Audio terjemahan 24kHz dikirim hanya ke lawan bicara.',
      webrtcTitle: 'Video WebRTC Terpisah',
      webrtcDesc:
        'WebRTC peer-to-peer membawa video kamera HD dan cadangan suara asli agar panggilan tetap terhubung meski terjemahan sempat tersendat.',
      securityTitle: 'Privasi, Keamanan & Presisi Bahasa',
      zeroDemoTitle: 'Tanpa Akun Demo:',
      zeroDemoDesc:
        'Semua pengguna masuk dengan akun email atau Google terverifikasi menggunakan hash SHA-256 untuk pencarian teman.',
      noRecordTitle: 'Tanpa Rekaman Default:',
      noRecordDesc: 'Media suara dan video tidak pernah disimpan; hanya metadata panggilan yang dicatat.',
      fidelityTitle: 'Akurasi Bangla & Indonesia:',
      fidelityDesc: 'Mengunci target BCP-47 bn dan id agar tidak bercampur dengan bahasa Hindi atau Melayu.',
      readinessTitle: 'Kesiapan Layanan',
      backendServer: 'Server Backend:',
      geminiLive: 'Gemini Live API:',
      firebaseProject: 'Proyek Firebase:',
      ready: 'Siap',
      checking: 'Memeriksa...',
      configured: 'Terkonfigurasi',
      missingKey: 'Kunci Hilang',
      connected: 'Terhubung',
      pending: 'Tertunda',
    },
    profile: {
      signInPromptTitle: 'Masuk untuk melihat Profil LinguaConnect ini',
      signInPromptDesc: 'Masuk dengan akun Anda untuk mengirim permintaan pertemanan atau menelepon.',
      loading: 'Memuat profil...',
      notFoundTitle: 'Profil Tidak Ditemukan',
      notFoundDesc: 'Tidak ada profil LinguaConnect AI yang cocok dengan',
      backDashboard: 'Kembali ke Dasbor',
      editMyProfile: 'Edit Profil Saya',
      voiceCall: 'Panggilan Suara',
      videoCall: 'Panggilan Video',
      friendReqSent: 'Permintaan Pertemanan Terkirim',
      respondDashboard: 'Tanggapi di Dasbor',
      sendFriendReq: 'Kirim Permintaan Pertemanan',
      shareableLinks: 'Tautan Profil Unik',
      copyUidUrl: 'Salin URL UID',
      copyHandleUrl: 'Salin URL Handle',
    },
    notificationsDrawer: {
      title: 'Notifikasi & Permintaan',
      pendingRequests: 'Permintaan Pertemanan Masuk',
      incomingEmpty: 'Tidak ada permintaan pertemanan masuk.',
      openFriendsPage: 'Kirim atau Kelola Permintaan',
      recentAlerts: 'Peringatan Terbaru',
      empty: 'Belum ada notifikasi. Panggilan masuk dan pembaruan teman muncul di sini.',
      markRead: 'Tandai dibaca',
      viewProfile: 'Lihat Profil',
    },
    addFriend: {
      title: 'Kirim Permintaan Pertemanan',
      enterGmail: 'Masukkan alamat email terdaftar atau @handle teman Anda',
      find: 'Cari',
      connectedOrPending: 'Terhubung / Tertunda',
      alreadySentYouHint: 'Sudah mengirim permintaan — terima di bawah:',
      sendRequest: 'Kirim Permintaan',
      sending: 'Mengirim...',
      notRegisteredTitle: 'belum terdaftar di LinguaConnect AI.',
      notRegisteredDesc:
        'Karena LinguaConnect AI menggunakan 100% akun asli, bagikan tautan profil unik Anda agar mereka masuk terlebih dahulu.',
      copyShareLink: 'Salin tautan profil Anda',
      importContactsTitle: 'Impor dari Google Contacts',
      importContactsDesc: 'Muat kontak Google asli Anda untuk mengirim permintaan pertemanan.',
      loadContacts: 'Muat Kontak',
      refreshContacts: 'Segarkan Kontak',
      noContacts: 'Tidak ada kontak dengan alamat email dari daftar Google Contacts Anda.',
      checkAndInvite: 'Periksa & Undang',
    },
    friendsPage: {
      title: 'Teman & Permintaan Pertemanan',
      subtitle: 'Kirim permintaan lewat Email atau @handle, terima permintaan masuk, dan telepon dengan terjemahan.',
      sendCardTitle: 'Kirim Permintaan Pertemanan Baru',
      sendCardDesc: 'Cari pengguna LinguaConnect AI terdaftar melalui email/Gmail atau @handle mereka.',
      sendPlaceholder: 'friend@gmail.com atau @handle',
      sendBtn: 'Kirim Permintaan',
      incomingTitle: 'Permintaan Pertemanan Masuk',
      incomingDesc: 'Terima atau tolak permintaan dari orang yang ingin terhubung dengan Anda.',
      incomingEmpty: 'Belum ada permintaan pertemanan masuk saat ini.',
      outgoingTitle: 'Permintaan Terkirim (Menunggu)',
      outgoingEmpty: 'Tidak ada permintaan terkirim yang menunggu.',
      cancelRequest: 'Batalkan',
      connectedTitle: 'Teman Terhubung',
      connectedEmpty: 'Teman yang sudah diterima muncul di sini untuk panggilan Suara dan Video.',
      viewProfile: 'Profil',
    },
    phraseDrawer: {
      title: 'Frasa Cerdas & Konteks',
      tabPhrase: 'Frasa Cepat',
      tabNuance: 'Nuansa Mendalam',
      tabContext: 'Cari & Peta',
      googleSearch: 'Google Search',
      googleMaps: 'Google Maps',
      translateBtn: 'Terjemahkan Instan',
      nuanceBtn: 'Analisis Nuansa Budaya & Tata Bahasa',
      mapsBtn: 'Cari Tempat di Peta',
      searchBtn: 'Cari Informasi Langsung',
      naturalTranslation: 'Terjemahan Alami',
      pronunciation: 'Pelafalan:',
      verifiedSources: 'Sumber & Tempat Terverifikasi',
    },
  },
};
