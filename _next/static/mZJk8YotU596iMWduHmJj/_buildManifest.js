self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [
      {
        "has": [
          {
            "type": "header",
            "key": "accept",
            "value": ".*text/markdown.*"
          }
        ],
        "source": "/",
        "destination": "/md"
      },
      {
        "has": [
          {
            "type": "header",
            "key": "accept",
            "value": ".*text/markdown.*"
          }
        ],
        "source": "/:ruta((?:es|en)(?:/.*)?)",
        "destination": "/md/:ruta"
      },
      {
        "has": [
          {
            "type": "header",
            "key": "accept",
            "value": ".*text/markdown.*"
          }
        ],
        "source": "/:ruta(docs|docs/.*|privacidad|terminos|registro)",
        "destination": "/md/:ruta"
      }
    ],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()