import { BodyPartMappings } from "../types/mapping";
import { MAPPINGS_KEY_PREFIX } from "../utils/mappingStorage";

export const defaultMappings: BodyPartMappings = {
  "Head & Face": {
    Forehead: {
      position: [0, -0.08, 0.09],
      scale: 0.1,
      cameraAzimuth: -0.3203325708907874,
      cameraPolar: 1.2777793348880442,
      cameraDistance: 0.8000000000000016,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin over bone.",
      },
    },
    Temple: {
      position: [
        0.06664326362198413, -0.07047368070650499, 0.006565593765047027,
      ],
      scale: 0.06,
      cameraAzimuth: 1.4226795747254652,
      cameraPolar: 1.3962120432264806,
      cameraDistance: 0.7999999999999957,
      placementSizeLimits: {
        min: 1,
        max: 4,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin over bone.",
      },
    },
    Scalp: {
      position: [0, -0.030000000000000002, 0],
      scale: 0.10999999999999999,
      cameraAzimuth: 0.01648649040386578,
      cameraPolar: 0.8297654388018162,
      cameraDistance: 0.8000000000000009,
      placementSizeLimits: {
        min: 3,
        max: 10,
        multiplier: 1.8,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin directly over the skull, vibration.",
      },
    },
    Jawline: {
      position: [
        -0.00538516770950892, -0.2352978737159798, 0.048460430490624304,
      ],
      scale: 0.08,
      cameraAzimuth: -0.015393670492600644,
      cameraPolar: 2.1088749577394306,
      cameraDistance: 0.7999999999999854,
      placementSizeLimits: {
        min: 1,
        max: 6,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 7,
        reason: "Over bone, thin skin.",
      },
    },
    "Behind Ear": {
      position: [0.08, -0.15, -0.035],
      scale: 0.04,
      cameraAzimuth: 1.8631075592396493,
      cameraPolar: 1.413903720463825,
      cameraDistance: 0.7999999999999995,
      placementSizeLimits: {
        min: 0.5,
        max: 3,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin over bone, sensitive area.",
      },
    },
  },
  Neck: {
    "Side Neck": {
      position: [0.06, -0.24, -0.03],
      scale: 0.09000000000000001,
      cameraAzimuth: 0.9145578742352042,
      cameraPolar: 1.5132365422673812,
      cameraDistance: 0.7999999999999938,
      placementSizeLimits: {
        min: 2,
        max: 6,
        multiplier: 1.05,
      },
      placementPainInfo: {
        level: 7,
        reason: "Sensitive area with thinner skin.",
      },
    },
    "Front Neck": {
      position: [0, -0.26, 0.04],
      scale: 0.08000000000000002,
      cameraAzimuth: 0.5365539719148095,
      cameraPolar: 1.594499913787963,
      cameraDistance: 0.7999999999999986,
      placementSizeLimits: {
        min: 2,
        max: 6,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 8,
        reason:
          "Sensitive skin, close to major nerves and arteries, Adam's apple.",
      },
    },
    Nape: {
      position: [0, -0.21000000000000002, -0.07],
      scale: 0.1,
      cameraAzimuth: 1.9924881711179265,
      cameraPolar: 1.3846611106976763,
      cameraDistance: 0.899999999999989,
      placementSizeLimits: {
        min: 1,
        max: 6,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 7,
        reason: "Near hairline and spine.",
      },
    },
  },
  "Upper Torso": {
   
    Collarbone: {
      position: [
        -0.11212400953919532, -0.3582967920609277, 0.035579659973843825,
      ],
      scale: 0.06262071441392927,
      cameraAzimuth: -0.09935170312439116,
      cameraPolar: 1.054655507066585,
      cameraDistance: 0.7950909672652665,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 9,
        reason: "Directly over bone, thin skin.",
      },
    },
    Pectoral: {
      position: [-0.08000000000000003, -0.41470831089571014, 0.06],
      scale: 0.12982049901274456,
      cameraAzimuth: -0.07150513268346533,
      cameraPolar: 1.2812785388443957,
      cameraDistance: 0.9224655521821995,
      placementSizeLimits: {
        min: 4,
        max: 16,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 5,
        reason: "Muscle area, moderate pain.",
      },
    },
    "Chest Center": {
      position: [-0.0008318588609381554, -0.3911198297304921, 0.08],
      scale: 0.19000000000000003,
      cameraAzimuth: 0.017694905316654103,
      cameraPolar: 1.168319289738879,
      cameraDistance: 1.6187144093757468,
      placementSizeLimits: {
        min: 3,
        max: 12,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 7,
        reason: "Close proximity to the sternum bone.",
      },
    },
    Sternum: {
      position: [0, -0.43317742390440284, 0.09],
      scale: 0.0719206605636331,
      cameraAzimuth: -0.2899534328470119,
      cameraPolar: 1.3854860672035354,
      cameraDistance: 1.2000000000000135,
      placementSizeLimits: {
        min: 2,
        max: 10,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 9,
        reason: "Very thin skin directly over bone, central nerve area.",
      },
    },
    Underboob: {
      position: [
        -0.09571249070441334, -0.5224119804087493, 0.12000000000000001,
      ],
      scale: 0.07352898940944175,
      cameraAzimuth: -0.6366095903501772,
      cameraPolar: 1.3842301532464565,
      cameraDistance: 1.2834361083718437,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Sensitive area, near ribs/sternum.",
      },
    },
    "Shoulder Blade": {
      position: [
        0.08897688710630816, -0.4112799182822628, -0.19576673117681656,
      ],
      scale: 0.14999999999999997,
      cameraAzimuth: 2.3285280399868435,
      cameraPolar: 1.4703483559480404,
      cameraDistance: 1.5000000000000009,
      placementSizeLimits: {
        min: 3,
        max: 10,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 6,
        reason: "Over bone, but often padded.",
      },
    },
    "Upper Back": {
      position: [0, -0.40000000000000013, -0.15],
      scale: 0.25,
      cameraAzimuth: 3.027052258921965,
      cameraPolar: 1.3080253779758066,
      cameraDistance: 1.6000000000000012,
      placementSizeLimits: {
        min: 4,
        max: 18,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 5,
        reason: "Large area, pain varies (spine vs muscle).",
      },
    },
    Spine: {
      position: [0, -0.5352350180783136, -0.15],
      scale: 0.17485370669538683,
      cameraAzimuth: 3.1414619955447387,
      cameraPolar: 1.4558499220917858,
      cameraDistance: 1.7000000000000013,
      placementSizeLimits: {
        min: 1,
        max: 24,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 8,
        reason: "Directly over vertebrae, numerous nerve endings.",
      },
    },
    "Full Back": {
      position: [0, -0.48000000000000015, -0.15],
      scale: 0.4800000000000001,
      cameraAzimuth: 3.141592653589793,
      cameraPolar: 1.5707963267948966,
      cameraDistance: 2.5,
      placementSizeLimits: {
        min: 100,
        max: 200,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 6,
        reason: "Varying pain levels across large area.",
      },
    },
    "Upper Ribs": {
      position: [
        -0.15777008487832414, -0.5644695745826602, -0.017243377695720135,
      ],
      scale: 0.13,
      cameraAzimuth: -0.6223505535168692,
      cameraPolar: 1.9582229107989086,
      cameraDistance: 1.032738934933417,
      placementSizeLimits: {
        min: 3,
        max: 12,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 9,
        reason: "Thin skin directly over bones, breathing movement.",
      },
    },
  },
  "Lower Torso": {
    "Lower Ribs": {
      position: [-0.16700464138267054, -0.6444695745826603, -0.04],
      scale: 0.12000000000000001,
      cameraAzimuth: -0.6575661625697877,
      cameraPolar: 1.9453031443668147,
      cameraDistance: 1.1000000000000025,
      placementSizeLimits: {
        min: 3,
        max: 10,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 9,
        reason: "Thin skin directly over bones, potentially more sensitive.",
      },
    },
    "Side Torso": {
      position: [
        -0.1609064581596899, -0.6739396471545477, -0.05287183650516719,
      ],
      scale: 0.2568784778316281,
      cameraAzimuth: -2.073290317823978,
      cameraPolar: 1.9099528173423457,
      cameraDistance: 1.6000000000000096,
      placementSizeLimits: {
        min: 4,
        max: 15,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 7,
        reason: "Covers sensitive areas like ribs/flank.",
      },
    },
    Obliques: {
      position: [-0.1613585660435417, -0.7029386875913533, 0.08481421647819065],
      scale: 0.10891222401723208,
      cameraAzimuth: -0.3683690694811454,
      cameraPolar: 1.4559186121043306,
      cameraDistance: 1.3999999999999788,
      placementSizeLimits: {
        min: 3,
        max: 12,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 6,
        reason: "Muscle area, moderate pain.",
      },
    },
    "Upper Abdomen": {
      position: [0, -0.6408810934174425, 0.11],
      scale: 0.11999999999999998,
      cameraAzimuth: 0.020696324897287587,
      cameraPolar: 1.5569517295400894,
      cameraDistance: 1.4000000000000352,
      placementSizeLimits: {
        min: 3,
        max: 16,
        multiplier: 1.3,
      },
      placementPainInfo: {
        level: 6,
        reason: "Can be sensitive, skin stretches.",
      },
    },
    "Lower Abdomen": {
      position: [0, -0.784996281765264, 0.1],
      scale: 0.10999999999999999,
      cameraAzimuth: -0.014916108971557608,
      cameraPolar: 1.5315974741733347,
      cameraDistance: 1.399999999999991,
      placementSizeLimits: {
        min: 3,
        max: 16,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 5,
        reason: "Often less sensitive than upper abdomen.",
      },
    },
    "Lower Back": {
      position: [0, -0.7193502064261352, -0.15],
      scale: 0.28904505474780107,
      cameraAzimuth: 3.141592653589793,
      cameraPolar: 1.5707963267948966,
      cameraDistance: 1.4,
      placementSizeLimits: {
        min: 3,
        max: 16,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 6,
        reason: "Pain varies, can be sensitive near spine/hips.",
      },
    },
    "Hip Front": {
      position: [-0.13930097186963092, -0.841407800600046, 0.06],
      scale: 0.09000000000000001,
      cameraAzimuth: -0.47414622671252465,
      cameraPolar: 1.4129268150149907,
      cameraDistance: 0.7297045148771955,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 7,
        reason: "Often close to the hip bone.",
      },
    },
    "Hip Side": {
      position: [-0.1721240095391953, -0.8342308382696104, -0.02],
      scale: 0.06000000000000002,
      cameraAzimuth: -0.48905537615796796,
      cameraPolar: 1.6113022138682365,
      cameraDistance: 1.022038041600536,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.3,
      },
      placementPainInfo: {
        level: 8,
        reason: "Directly over hip bone often.",
      },
    },
  },
  Arms: {
    Deltoid: {
      position: [
        -0.2434161602174525, -0.3911198297304921, -0.07930097186963092,
      ],
      scale: 0.15000000000000002,
      cameraAzimuth: -0.8867816565273788,
      cameraPolar: 1.3622430566983357,
      cameraDistance: 1.696023584812653,
      placementSizeLimits: {
        min: 3,
        max: 10,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 4,
      },
    },
    "Quarter Sleeve": {
      position: [
        -0.3090622355565813, -0.48958894273918485, -0.030066415365284538,
      ],
      scale: 0.1217788547837013,
      cameraAzimuth: -0.2473938163988431,
      cameraPolar: 1.361856931984547,
      cameraDistance: 1.999999999999995,
      placementSizeLimits: {
        min: 4,
        max: 12,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 4,
        reason: "Mostly deltoid/outer bicep area.",
      },
    },
    "Half Sleeve": {
      position: [-0.325, -0.44, -0.01],
      scale: 0.21345359899479446,
      cameraAzimuth: -0.44846661794400705,
      cameraPolar: 1.1437360096844063,
      cameraDistance: 1.298040874939098,
      placementSizeLimits: {
        min: 50,
        max: 100,
        multiplier: 1.3,
      },
      placementPainInfo: {
        level: 4,
        reason: "Mainly covers lower pain areas like bicep/deltoid.",
      },
    },
    Elbow: {
      position: [-0.4111198297304921, -0.646527168756571, -0.08],
      scale: 0.07,
      cameraAzimuth: -2.277012484095214,
      cameraPolar: 1.3684717809265368,
      cameraDistance: 1.8604597516229464,
      placementSizeLimits: {
        min: 2,
        max: 6,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 8,
        reason: "Directly over bone, thin skin, folds often.",
      },
    },
    "Elbow Ditch": {
      position: [-0.38, -0.64, 0.0027566223042798654],
      scale: 0.06,
      cameraAzimuth: -0.38085799124988856,
      cameraPolar: 1.3579144225873843,
      cameraDistance: 1.0041118942853549,
      placementSizeLimits: {
        min: 1,
        max: 4,
        multiplier: 1.7,
      },
      placementPainInfo: {
        level: 9,
        reason: "Very sensitive skin, nerve endings, folds.",
      },
    },
    "Back Forearm": {
      position: [-0.3, -0.55, -0.15],
      scale: 0.14,
      cameraAzimuth: -2.2952498901343423,
      cameraPolar: 1.5471168308962344,
      cameraDistance: 2.069927717943239,
      placementSizeLimits: {
        min: 3,
        max: 12,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 4,
      },
    },
    "Inner Forearm": {
      position: [-0.287, -0.593, -0.019],
      scale: 0.1153455394004667,
      cameraAzimuth: 0.6,
      cameraPolar: 1.7,
      cameraDistance: 1,
      placementSizeLimits: {
        min: 2,
        max: 10,
        multiplier: 1,
      },
      placementPainInfo: {
        level: 4,
      },
    },
    "Outer Forearm": {
      position: [-0.473, -0.736, 0],
      scale: 0.16,
      cameraAzimuth: -0.5932904597143365,
      cameraPolar: 1.2704732958447933,
      cameraDistance: 1.7575634023129976,
      placementSizeLimits: {
        min: 2,
        max: 12,
        multiplier: 1,
      },
      placementPainInfo: {
        level: 3,
      },
    },
    Wrist: {
      position: [-0.493, -0.805, 0.023],
      scale: 0.1,
      cameraAzimuth: -0.7172345434609471,
      cameraPolar: 1.0902484975441875,
      cameraDistance: 1.817663090363773,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin, close to bones and tendons.",
      },
    },
    "Wrist Crease": {
      position: [-0.4567659050696209, -0.82, 0.01],
      scale: 0.05744570095135523,
      cameraAzimuth: 0.5237259692553915,
      cameraPolar: 1.5181557220688222,
      cameraDistance: 0.7999999999999995,
      placementSizeLimits: {
        min: 0.5,
        max: 3,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Very thin skin, high movement area.",
      },
    },
    "Full Sleeve": {
      position: [-0.41, -0.59, -0.06288945303484894],
      scale: 0.1893286663076647,
      cameraAzimuth: -0.6818199308042318,
      cameraPolar: 1.193389824788707,
      cameraDistance: 1.494979100956484,
      placementSizeLimits: {
        min: 100,
        max: 200,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 6,
        reason:
          "Covers varying pain levels (elbow/ditch high, bicep/forearm moderate).",
      },
    },
  },
  Hands: {
    "Hand Top": {
      position: [
        -0.5535430646320368, -0.8716126471291419, 0.025663520450404355,
      ],
      scale: 0.056292953123397264,
      cameraAzimuth: -0.49613000219910264,
      cameraPolar: 1.2897009973892481,
      cameraDistance: 0.5999999999999996,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Thin skin, many bones and nerve endings.",
      },
    },
    Knuckles: {
      position: [
        -0.5814384925317158, -0.8755948502684068, 0.027587239265938413,
      ],
      scale: 0.03,
      cameraAzimuth: -0.7610039972410667,
      cameraPolar: 1.0760223873043793,
      cameraDistance: 0.5,
      placementSizeLimits: {
        min: 0.5,
        max: 2.5,
        multiplier: 1.8,
      },
      placementPainInfo: {
        level: 9,
        reason: "Directly over bone, thin skin, high movement.",
      },
    },
    Fingers: {
      position: [-0.5798030567237666, -0.9299999999999999, 0.04],
      scale: 0.04,
      cameraAzimuth: -0.3692321451910787,
      cameraPolar: 1.2265819744461894,
      cameraDistance: 0.5,
      placementSizeLimits: {
        min: 0.5,
        max: 2,
        multiplier: 1.8,
      },
      placementPainInfo: {
        level: 9,
        reason: "Very thin skin, bones, many nerve endings, high usage.",
      },
    },
    "Finger Side": {
      position: [-0.5541552979792799, -0.9208657298184428, 0.0674387116627346],
      scale: 0.03,
      cameraAzimuth: -0.28729621722360443,
      cameraPolar: 1.558968756743131,
      cameraDistance: 0.5999999999999994,
      placementSizeLimits: {
        min: 0.5,
        max: 1.5,
        multiplier: 1.9,
      },
      placementPainInfo: {
        level: 9,
        reason: "Thin skin, constant friction.",
      },
    },
    Thumb: {
      position: [-0.5177433582931585, -0.9044537901323213, 0.09102677197661262],
      scale: 0.04,
      cameraAzimuth: -0.2533109285056402,
      cameraPolar: 1.231004555861638,
      cameraDistance: 0.653749999999962,
      placementSizeLimits: {
        min: 0.5,
        max: 2.5,
        multiplier: 1.7,
      },
      placementPainInfo: {
        level: 8,
        reason: "Bony, thin skin, nerve endings.",
      },
    },
  },

  Legs: {
    "Thigh Front": {
      position: [
        -0.12026874551236011, -1.1542209457380246, 0.018202892604369542,
      ],
      scale: 0.10866960713919377,
      cameraAzimuth: -0.0037025856689594044,
      cameraPolar: 1.552359329305573,
      cameraDistance: 1.484210526315787,
      placementSizeLimits: {
        min: 4,
        max: 20,
        multiplier: 1,
      },
      placementPainInfo: {
        level: 4,
      },
    },
    "Outer Thigh": {
      position: [
        -0.20232844394296823, -1.121397066365781, -0.07103292645399506,
      ],
      scale: 0.13545286696071393,
      cameraAzimuth: -0.4314972867631766,
      cameraPolar: 1.5528106624602576,
      cameraDistance: 1.5000000000000002,
      placementSizeLimits: {
        min: 4,
        max: 20,
        multiplier: 1,
      },
      placementPainInfo: {
        level: 3,
        reason: "Generally low pain.",
      },
    },
    Hamstring: {
      // Specific Hamstring Focus
      position: [
        -0.12026874551236011, -1.1542209457380246, -0.15309262488460362,
      ],
      scale: 0.1483198276746333,
      cameraAzimuth: 3.0296837204387863,
      cameraPolar: 1.5165289297620894,
      cameraDistance: 1.6000000000000008,
      placementSizeLimits: {
        min: 4,
        max: 18,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 5,
        reason: "Large muscle group, can be sensitive.",
      },
    },
    "Inner Thigh": {
      position: [
        -0.054620986767873525, -1.170632885424146, -0.07103292645399506,
      ],
      scale: 0.13062775669299415,
      cameraAzimuth: 0.6274486197883806,
      cameraPolar: 1.6313787584349257,
      cameraDistance: 1.399999999999996,
      placementSizeLimits: {
        min: 3,
        max: 12,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 7,
        reason: "Sensitive skin, high friction area.",
      },
    },
    "Upper Inner Thigh": {
      // Duplicate 1/2
      position: [
        -0.10900717102324765, -0.996127943788147, 0.052559975475656225,
      ],
      scale: 0.09202687455123602,
      cameraAzimuth: -0.084692039054511,
      cameraPolar: 1.3381441325843992,
      cameraDistance: 0.8000000000000083,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Very sensitive skin, high friction.",
      },
    },
    "Knee Cap": {
      position: [
        -0.15668068519848208, -1.416811980715971, -0.03820904708175199,
      ],
      scale: 0.10167709508667554,
      cameraAzimuth: 0.07215642789051159,
      cameraPolar: 1.4269378924205895,
      cameraDistance: 1.299999999999998,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 8,
        reason: "Directly over bone, tendons, skin folds.",
      },
    },
    "Knee Ditch": {
      position: [
        -0.1366806851984821, -1.3675761616576059, -0.12026874551236011,
      ],
      scale: 0.09524361472971586,
      cameraAzimuth: -3.021535403452228,
      cameraPolar: 1.2406291335167108,
      cameraDistance: 1.2999999999999456,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.8,
      },
      placementPainInfo: {
        level: 9,
        reason: "Very sensitive, thin skin, folds, nerves.",
      },
    },
    Shin: {
      position: [
        -0.18591650425684714, -1.6301671966355524, -0.07103292645399506,
      ],
      scale: 0.10363524464047594,
      cameraAzimuth: -0.04633275486073978,
      cameraPolar: 1.5315672058025458,
      cameraDistance: 1.5,
      placementSizeLimits: {
        min: 3,
        max: 14,
        multiplier: 1.3,
      },
      placementPainInfo: {
        level: 7,
        reason: "Thin skin directly over the tibia bone.",
      },
    },
    Calf: {
      position: [-0.18591650425684714, -1.548107498204944, -0.16],
      scale: 0.10999999999999999,
      cameraAzimuth: -2.7274517525882462,
      cameraPolar: 1.3045399142128415,
      cameraDistance: 1.499999999999998,
      placementSizeLimits: {
        min: 3,
        max: 14,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 5,
      },
    },
    "Full Leg": {
      position: [
        -0.16686392511468492, -1.2759880559661791, -0.07003730466502205,
      ],
      scale: 0.3229326084726638,
      cameraAzimuth: -0.1556394524153168,
      cameraPolar: 1.4196110842094658,
      cameraDistance: 1.4999999999999876,
      placementSizeLimits: {
        min: 100,
        max: 200,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 6,
        reason: "Covers high and low pain areas.",
      },
    },
    "Half Leg": {
      position: [
        -0.17891735941350964, -1.614332281118673, -0.12193596722181364,
      ],
      scale: 0.16209559954867164,
      cameraAzimuth: -0.34694268506456594,
      cameraPolar: 1.471313194809976,
      cameraDistance: 1.499999999999915,
      placementSizeLimits: {
        min: 50,
        max: 100,
        multiplier: 1.4,
      },
      placementPainInfo: {
        level: 6,
        reason: "Covers shin (high pain) and calf (moderate).",
      },
    },
  },
  "Feet & Ankles": {
    "Ankle Front": {
      position: [
        -0.16591650425684715, -1.803522412555134, -0.08744486614011704,
      ],
      scale: 0.07,
      cameraAzimuth: -0.7696187064121561,
      cameraPolar: 1.2602138204618807,
      cameraDistance: 0.9999999999999701,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.3,
      },
      placementPainInfo: {
        level: 8,
        reason: "Thin skin, close to bones and tendons.",
      },
    },
    "Inner Ankle": {
      position: [
        -0.15309262488460362, -1.8106985331828906, -0.11309262488460363,
      ],
      scale: 0.05,
      cameraAzimuth: 0.7205573362187079,
      cameraPolar: 1.1369261824499055,
      cameraDistance: 0.9999999999999765,
      placementSizeLimits: {
        min: 1,
        max: 3,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 9,
        reason: "Directly over ankle bone, thin skin.",
      },
    },
    "Outer Ankle": {
      position: [
        -0.19840714716208957, -1.8339402949991341, -0.1213052376597757,
      ],
      scale: 0.060000000000000005,
      cameraAzimuth: -0.992777271266516,
      cameraPolar: 1.1330356830298198,
      cameraDistance: 1.0000000000000058,
      placementSizeLimits: {
        min: 1,
        max: 3,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 9,
        reason: "Directly over ankle bone, thin skin.",
      },
    },
    "Foot Top": {
      position: [
        -0.18437706614165025, -1.853408659336856, -0.03314215737179746,
      ],
      scale: 0.05,
      cameraAzimuth: -0.10525600053294015,
      cameraPolar: 1.0249216027083723,
      cameraDistance: 0.6000000000000036,
      placementSizeLimits: {
        min: 1,
        max: 6,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Thin skin, many bones and tendons.",
      },
    },
    "Foot Side": {
      position: [
        -0.20823473372119025, -1.8774276781849915, -0.05895458531701246,
      ],
      scale: 0.07,
      cameraAzimuth: -0.4901127400063154,
      cameraPolar: 1.1676965003470179,
      cameraDistance: 0.6000000000000034,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 7,
        reason: "Can be bony, thin skin.",
      },
    },
    "Foot Arch": {
      position: [
        -0.13309262488460363, -1.8799343522412555, -0.051032926453995056,
      ],
      scale: 0.060000000000000005,
      cameraAzimuth: 1.3485632233360163,
      cameraPolar: 1.3241717326337286,
      cameraDistance: 0.5361460560920751,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Sensitive skin, can tickle/hurt intensely.",
      },
    },
    Heel: {
      position: [-0.16950456457072516, -1.8327582316134987, -0.14],
      scale: 0.062376654015796486,
      cameraAzimuth: -2.2610322489552677,
      cameraPolar: 1.3019623200034927,
      cameraDistance: 0.7887755029471025,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.2,
      },
      placementPainInfo: {
        level: 6,
        reason: "Thicker skin, but can be sensitive.",
      },
    },
    Toes: {
      position: [-0.16950456457072516, -1.8927582316134988, 0.0674387116627346],
      scale: 0.04,
      cameraAzimuth: -0.25820746460012706,
      cameraPolar: 1.2792663070114167,
      cameraDistance: 0.7831753899985433,
      placementSizeLimits: {
        min: 0.5,
        max: 1.5,
        multiplier: 1.8,
      },
      placementPainInfo: {
        level: 9,
        reason: "Very thin skin, bones, many nerve endings.",
      },
    },
  },
  "Intimate Areas": {
    "Groin Crease": {
      position: [-0.09000000000000001, -0.9865134885629296, 0.06],
      scale: 0.06,
      cameraAzimuth: -0.10207375071633176,
      cameraPolar: 1.5,
      cameraDistance: 0.8080332409972304,
      placementSizeLimits: {
        min: 1,
        max: 4,
        multiplier: 1.9,
      },
      placementPainInfo: {
        level: 10,
        reason: "Extremely sensitive, thin skin, high friction, nerve endings.",
      },
    },
    Underbutt: {
      position: [0.14, -1.0393373679351727, -0.16],
      scale: 0.1,
      cameraAzimuth: 2.3170808268966496,
      cameraPolar: 1.4245783144059394,
      cameraDistance: 1.2000000000000028,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.5,
      },
      placementPainInfo: {
        level: 8,
        reason: "Sensitive crease area.",
      },
    },
    "Upper Inner Thigh": {
      // Duplicate 2/2
      position: [
        -0.10900717102324765, -0.996127943788147, 0.052559975475656225,
      ],
      scale: 0.09202687455123602,
      cameraAzimuth: -0.084692039054511,
      cameraPolar: 1.3381441325843992,
      cameraDistance: 0.8000000000000083,
      placementSizeLimits: {
        min: 2,
        max: 8,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 8,
        reason: "Very sensitive skin, high friction.",
      },
    },
    Tailbone: {
      // Duplicate 2/2
      position: [0, -0.8203343932711049, -0.1],
      scale: 0.07,
      cameraAzimuth: 2.7732206516140376,
      cameraPolar: 1.150019926301074,
      cameraDistance: 0.799999999999992,
      placementSizeLimits: {
        min: 1,
        max: 5,
        multiplier: 1.6,
      },
      placementPainInfo: {
        level: 9,
        reason: "Directly over bone, very sensitive.",
      },
    },
    Buttock: {
      // Duplicate 2/2
      position: [
        0.10591034977946424, -0.9408657298184429, -0.15999999999999998,
      ],
      scale: 0.14999999999999997,
      cameraAzimuth: 2.7206187580163386,
      cameraPolar: 1.3752776151519825,
      cameraDistance: 0.9999999999999994,
      placementSizeLimits: {
        min: 4,
        max: 15,
        multiplier: 1.1,
      },
      placementPainInfo: {
        level: 6,
        reason: "Mostly fatty tissue, pain varies.",
      },
    },
  },
};

export const initializeDefaultModel = () => {
  console.group("🔄 Initializing Default Model Mappings");
  console.log("Starting initialization check for default mappings");

  // Use dynamic imports to avoid circular dependency
  const initializeMapping = async () => {
    // Check localStorage availability first
    if (typeof window === "undefined" || !window.localStorage) {
      console.warn(
        "localStorage not available. Skipping default mapping initialization."
      );
      console.groupEnd();
      return;
    }

    try {
      console.log("Loading required modules for mapping initialization...");

      // Import modules dynamically
      const modelModule = await import("./defaultModels");
      // ---> No need to import saveMappings dynamically if we only use its prefix constant here
      // const storageModule = await import('../utils/mappingStorage');
      // const { saveMappings } = storageModule; // Only import saveMappings if needed below

      const { defaultModels } = modelModule;

      if (defaultModels.length > 0) {
        const defaultModelId = defaultModels[0].id;
        // ---> Construct the key consistently
        const storageKey = `${MAPPINGS_KEY_PREFIX}${defaultModelId}`;
        console.log(`Checking for existing mappings with key: ${storageKey}`);

        // ---> Check if mappings already exist <---
        if (localStorage.getItem(storageKey) !== null) {
          console.log(
            `✅ Mappings for default model "${defaultModelId}" already exist in localStorage. Initialization skipped.`
          );
        } else {
          console.log(
            `⏳ No existing mappings found for "${defaultModelId}". Attempting to save defaults...`
          );
          // ---> Dynamically import saveMappings only when actually needed
          const { saveMappings } = await import("../utils/mappingStorage");
          saveMappings(defaultModelId, defaultMappings); // This function now internally checks again, but this outer check prevents unnecessary logging/work if already present.
          console.log(
            `✅ Default mappings initialized successfully for model: ${defaultModelId}`
          );
        }
      } else {
        console.error("❌ No default models found to initialize mappings for.");
      }
    } catch (error) {
      console.error("❌ Error initializing default mappings:", error);
    }

    console.groupEnd();
  };

  // Use setTimeout to ensure this runs after module initialization and localStorage is likely available
  // Consider if a different trigger (e.g., App initialization) is more appropriate than immediate execution + setTimeout
  setTimeout(initializeMapping, 100);
};

// Call the initialization function immediately (or consider moving this call)
console.log(
  "🚀 Default Mappings module loaded - scheduling initialization check"
);
initializeDefaultModel();
