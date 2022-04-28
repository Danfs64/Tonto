/******************************************************************************
 * This file was generated by langium-cli 0.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import { loadGrammar, Grammar } from 'langium';

let loadedTontoGrammar: Grammar | undefined;
export const TontoGrammar = (): Grammar => loadedTontoGrammar ||(loadedTontoGrammar = loadGrammar(`{
  "$type": "Grammar",
  "usedGrammars": [],
  "hiddenTokens": [],
  "imports": [],
  "rules": [
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Model",
      "hiddenTokens": [],
      "entry": true,
      "alternatives": {
        "$type": "Assignment",
        "feature": "elements",
        "operator": "+=",
        "terminal": {
          "$type": "RuleCall",
          "arguments": [],
          "rule": {
            "$refText": "ModelElement"
          }
        },
        "cardinality": "*",
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "ModelElement",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "module",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "arguments": [],
          "rule": {
            "$refText": "ContextModule"
          }
        },
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "ContextModule",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "module",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "QualifiedName"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": "{"
          },
          {
            "$type": "Assignment",
            "feature": "elements",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Element"
              }
            },
            "cardinality": "*"
          },
          {
            "$type": "Keyword",
            "value": "}"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "QualifiedName",
      "hiddenTokens": [],
      "type": {
        "$type": "ReturnType",
        "name": "string"
      },
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "ID"
            },
            "elements": []
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": ".",
                "elements": []
              },
              {
                "$type": "RuleCall",
                "arguments": [],
                "rule": {
                  "$refText": "ID"
                }
              }
            ],
            "cardinality": "*"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Element",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "prefix",
                "operator": "=",
                "terminal": {
                  "$type": "RuleCall",
                  "arguments": [],
                  "rule": {
                    "$refText": "ClassPrefix"
                  }
                },
                "cardinality": "?",
                "elements": []
              },
              {
                "$type": "RuleCall",
                "arguments": [],
                "rule": {
                  "$refText": "Class"
                }
              }
            ]
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Endurant"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Relator"
            },
            "elements": []
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Stereotype",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "@",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "stereotype",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "ClassPrefix",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "stereotype",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "arguments": [],
          "rule": {
            "$refText": "Stereotype"
          }
        },
        "cardinality": "?",
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Class",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "class",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "specializes",
                "elements": []
              },
              {
                "$type": "Assignment",
                "feature": "specializationClass",
                "operator": "=",
                "terminal": {
                  "$type": "CrossReference",
                  "type": {
                    "$refText": "Class"
                  },
                  "terminal": {
                    "$type": "RuleCall",
                    "arguments": [],
                    "rule": {
                      "$refText": "ID"
                    }
                  }
                }
              }
            ],
            "cardinality": "?"
          },
          {
            "$type": "Keyword",
            "value": "{"
          },
          {
            "$type": "Assignment",
            "feature": "references",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "EndurantReference"
              }
            },
            "cardinality": "*"
          },
          {
            "$type": "Keyword",
            "value": "}"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Endurant",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "type",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "EndurantType"
              }
            },
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "specializes",
                "elements": []
              },
              {
                "$type": "Assignment",
                "feature": "specializationEndurant",
                "operator": "=",
                "terminal": {
                  "$type": "CrossReference",
                  "type": {
                    "$refText": "Endurant"
                  },
                  "terminal": {
                    "$type": "RuleCall",
                    "arguments": [],
                    "rule": {
                      "$refText": "ID"
                    }
                  }
                }
              }
            ],
            "cardinality": "?"
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "{",
                "elements": []
              },
              {
                "$type": "Keyword",
                "value": "}"
              }
            ],
            "cardinality": "?"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "EndurantType",
      "hiddenTokens": [],
      "type": {
        "$type": "ReturnType",
        "name": "string"
      },
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Keyword",
            "value": "kind",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "subkind",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "collective",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "phase",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "role",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "category",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "roleMixin",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "mode",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "quality",
            "elements": []
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "EndurantReference",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "ref",
            "cardinality": "?",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "refName",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": ":"
          },
          {
            "$type": "Assignment",
            "feature": "referencedClass",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$refText": "Class"
              }
            }
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Relator",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "relator",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": "{"
          },
          {
            "$type": "Assignment",
            "feature": "references",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "EndurantReference"
              }
            },
            "cardinality": "*"
          },
          {
            "$type": "Keyword",
            "value": "}"
          }
        ]
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "WS",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\s+",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "name": "ID",
      "terminal": {
        "$type": "RegexToken",
        "regex": "[_a-zA-Z][\\\\w_]*",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "name": "INT",
      "type": {
        "$type": "ReturnType",
        "name": "number"
      },
      "terminal": {
        "$type": "RegexToken",
        "regex": "[0-9]+",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "name": "STRING",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\"[^\\"]*\\"|'[^']*'",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "ML_COMMENT",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\/\\\\*[\\\\s\\\\S]*?\\\\*\\\\/",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "SL_COMMENT",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\/\\\\/[^\\\\n\\\\r]*",
        "elements": []
      }
    }
  ],
  "interfaces": [],
  "types": [],
  "isDeclared": true,
  "name": "Tonto"
}`));
