/**
 * High-fidelity equirectangular vector projection paths for world landmasses.
 * viewBox: "0 0 1000 500"
 * lon: -180 (x=0) to +180 (x=1000)
 * lat: +90 (y=0) to -90 (y=500)
 */

export interface LandmassPolygon {
  id: string;
  name: string;
  path: string;
}

export const WORLD_LANDMASS_PATHS: LandmassPolygon[] = [
  // North America (Alaska, Canada, contiguous US, Mexico)
  {
    id: 'north_america',
    name: 'América del Norte',
    path: `M 95 62
           C 120 48, 175 42, 230 48
           C 255 42, 290 55, 305 78
           C 318 92, 335 105, 342 125
           C 328 140, 310 155, 295 160
           C 285 178, 280 205, 272 225
           C 260 235, 252 248, 245 270
           C 238 275, 222 265, 220 252
           C 212 230, 202 215, 192 195
           C 178 185, 155 180, 142 165
           C 132 145, 115 130, 102 110
           C 85 95, 75 75, 95 62 Z`,
  },
  // Greenland
  {
    id: 'greenland',
    name: 'Groenlandia',
    path: `M 365 42
           C 390 35, 420 38, 435 52
           C 432 75, 415 98, 395 110
           C 378 115, 362 95, 358 75
           C 355 58, 358 45, 365 42 Z`,
  },
  // Caribbean & Central American Isthmus
  {
    id: 'central_america_caribbean',
    name: 'Caribe e Istmo Central',
    path: `M 245 270
           C 258 278, 275 288, 292 295
           C 285 300, 272 302, 260 292
           C 252 285, 248 278, 245 270 Z
           M 298 252
           C 312 250, 332 254, 340 258
           C 330 262, 310 260, 298 252 Z
           M 312 260
           C 322 259, 335 262, 338 266
           C 328 268, 315 265, 312 260 Z`,
  },
  // South America
  {
    id: 'south_america',
    name: 'América del Sur',
    path: `M 292 295
           C 310 285, 345 280, 375 292
           C 402 305, 418 335, 422 360
           C 415 390, 392 425, 370 455
           C 358 480, 345 492, 338 485
           C 335 465, 332 435, 328 410
           C 315 385, 302 355, 295 330
           C 288 312, 285 300, 292 295 Z`,
  },
  // Europe
  {
    id: 'europe',
    name: 'Europa',
    path: `M 470 95
           C 485 82, 510 75, 545 78
           C 572 82, 595 98, 608 120
           C 590 135, 565 142, 545 148
           C 532 158, 510 162, 492 165
           C 480 160, 465 155, 458 140
           C 462 125, 465 110, 470 95 Z
           M 465 118
           C 475 112, 485 115, 482 128
           C 472 135, 462 130, 465 118 Z`,
  },
  // Africa
  {
    id: 'africa',
    name: 'África',
    path: `M 465 178
           C 490 170, 552 172, 585 195
           C 620 225, 638 268, 625 300
           C 605 340, 580 390, 560 415
           C 542 425, 528 410, 520 380
           C 512 345, 495 315, 465 292
           C 440 270, 435 240, 442 215
           C 448 195, 455 182, 465 178 Z
           M 632 355
           C 642 345, 648 375, 638 395
           C 630 385, 628 365, 632 355 Z`,
  },
  // Asia (including Middle East, Central Asia, Russia/Siberia, China, India, SE Asia)
  {
    id: 'asia',
    name: 'Asia',
    path: `M 598 85
           C 635 65, 715 55, 810 60
           C 870 65, 930 80, 965 105
           C 955 125, 930 145, 905 160
           C 885 185, 872 220, 855 250
           C 840 270, 815 285, 792 280
           C 785 260, 775 235, 755 220
           C 738 235, 725 265, 710 288
           C 695 275, 680 245, 665 230
           C 645 222, 625 210, 615 190
           C 605 165, 600 135, 598 85 Z
           M 890 135
           C 905 125, 915 145, 908 175
           C 898 185, 885 160, 890 135 Z`,
  },
  // Japan Archipelagos
  {
    id: 'japan',
    name: 'Japón',
    path: `M 895 155
           C 908 148, 918 162, 912 185
           C 905 192, 895 180, 895 155 Z`,
  },
  // Southeast Asia Islands & Indonesia
  {
    id: 'indonesia_philippines',
    name: 'Sudeste Asiático e Insulindia',
    path: `M 780 295
           C 810 292, 840 298, 860 305
           C 850 315, 820 312, 780 295 Z
           M 815 315
           C 835 312, 855 318, 845 325
           C 830 328, 818 322, 815 315 Z
           M 860 235
           C 872 230, 878 245, 870 262
           C 862 258, 858 245, 860 235 Z`,
  },
  // Australia & New Zealand
  {
    id: 'australia_oceania',
    name: 'Oceanía y Australasia',
    path: `M 805 345
           C 840 330, 882 332, 905 352
           C 915 378, 905 408, 885 422
           C 858 428, 830 422, 815 405
           C 802 388, 795 365, 805 345 Z
           M 935 422
           C 945 418, 952 432, 945 448
           C 938 450, 932 435, 935 422 Z`,
  },
];

// Longitude & Latitude Graticule Lines (for coordinates grid)
export const GRATICULE_MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
export const GRATICULE_PARALLELS = [-60, -30, 0, 30, 60];

// Equator, Tropics & Reference Latitudes
export const SPECIAL_LATITUDES = [
  { name: 'Círculo Polar Ártico (+66.5°)', lat: 66.5, stroke: 'rgba(56, 189, 248, 0.15)', dash: '2 4' },
  { name: 'Trópico de Cáncer (+23.5°)', lat: 23.5, stroke: 'rgba(148, 163, 184, 0.18)', dash: '3 3' },
  { name: 'Ecuador (0°)', lat: 0, stroke: 'rgba(56, 189, 248, 0.35)', dash: 'none' },
  { name: 'Trópico de Capricornio (-23.5°)', lat: -23.5, stroke: 'rgba(148, 163, 184, 0.18)', dash: '3 3' },
  { name: 'Círculo Polar Antártico (-66.5°)', lat: -66.5, stroke: 'rgba(56, 189, 248, 0.15)', dash: '2 4' },
];
