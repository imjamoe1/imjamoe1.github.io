(function() {
    'use strict';
    
    console.log("MAXSM-RATINGS: Start");   
    
    var star_svg = '<svg viewBox="5 5 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="white" stroke-width="2" d="M32 18.7461L36.2922 27.4159L46.2682 28.6834L38.9675 35.3631L40.7895 44.8469L32 40.2489L23.2105 44.8469L25.0325 35.3631L17.7318 28.6834L27.7078 27.4159L32 18.7461ZM32 23.2539L29.0241 29.2648L22.2682 30.1231L27.2075 34.6424L25.9567 41.1531L32 37.9918L38.0433 41.1531L36.7925 34.6424L41.7318 30.1231L34.9759 29.2648L32 23.2539Z"/><path fill="none" stroke="white" stroke-width="2" d="M32 9C19.2975 9 9 19.2975 9 32C9 44.7025 19.2975 55 32 55C44.7025 55 55 44.7025 55 32C55 19.2975 44.7025 9 32 9ZM7 32C7 18.1929 18.1929 7 32 7C45.8071 7 57 18.1929 57 32C57 45.8071 45.8071 57 32 57C18.1929 57 7 45.8071 7 32Z"/></svg>';
    var avg_svg = '<svg width="64" height="64" viewBox="10 10 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.4517 11.3659C31.8429 10.7366 32.7589 10.7366 33.1501 11.3659L40.2946 22.8568C40.4323 23.0782 40.651 23.2371 40.9041 23.2996L54.0403 26.5435C54.7598 26.7212 55.0428 27.5923 54.5652 28.1589L45.8445 38.5045C45.6764 38.7039 45.5929 38.961 45.6117 39.221L46.5858 52.7168C46.6392 53.4559 45.8982 53.9942 45.2117 53.7151L32.6776 48.6182C32.4361 48.52 32.1657 48.52 31.9242 48.6182L19.39 53.7151C18.7036 53.9942 17.9626 53.4559 18.016 52.7168L18.9901 39.221C19.0089 38.961 18.9253 38.7039 18.7573 38.5045L10.0366 28.1589C9.559 27.5923 9.84204 26.7212 10.5615 26.5435L23.6977 23.2996C23.9508 23.2371 24.1695 23.0782 24.3072 22.8568L31.4517 11.3659Z" fill="#FFDF6D"/><path fill-rule="evenodd" clip-rule="evenodd" d="M30.6024 10.8379C31.385 9.57926 33.2168 9.57926 33.9994 10.8379L41.1438 22.3288L54.2801 25.5727C55.7189 25.928 56.285 27.6702 55.3298 28.8034L46.6091 39.149L47.5832 52.6448C47.6899 54.123 46.208 55.1997 44.8351 54.6414L32.3009 49.5445L19.7667 54.6414C18.3938 55.1997 16.9118 54.123 17.0185 52.6448L17.9927 39.149L9.272 28.8034C8.3168 27.6702 8.88287 25.928 10.3217 25.5727L23.4579 22.3288L30.6024 10.8379ZM39.4454 23.3848L32.3009 11.8939L25.1564 23.3848C24.8811 23.8276 24.4437 24.1454 23.9374 24.2704L10.8012 27.5144L19.5219 37.86C19.858 38.2587 20.0251 38.7729 19.9875 39.293L19.0134 52.7888L31.5475 47.6919C32.0306 47.4954 32.5712 47.4954 33.0543 47.6919L45.5884 52.7888L44.6143 39.293C44.5767 38.7729 44.7438 38.2587 45.0799 37.86L53.8006 27.5144L40.6643 24.2704C40.1581 24.1454 39.7207 23.8276 39.4454 23.3848Z" fill="black"/></svg>';
    var oscars_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="255" height="255" viewBox="0 0 255 255">  <g transform="translate(77.561474, 0)">    <path      fill="#f0c60b"      d="M 2.2993819,243.56494 C -1.1026591,241.60427 -0.9385111,241.52608 4.2015339,240.00521 L 8.0440949,239.03157 L 8.2617039,226.55609 C 8.2617039,226.55609 11.280223,225.67709 12.312216,225.53163 C 14.427728,225.23345 19.775685,224.14614 24.36752,223.70487 C 28.959355,223.26362 33.61375,223.36451 33.61375,223.36451 C 35.705809,217.55816 35.821325,205.39069 32.708355,191.27168 C 31.382336,185.25747 31.024339,182.15035 31.881607,170.34849 C 32.785302,157.90746 32.369435,156.25117 30.366705,149.83556 C 28.541293,143.98797 27.847485,140.74011 27.857558,129.73289 C 27.864165,122.51234 28.704973,114.4525 29.305577,111.82215 C 30.637862,105.98738 29.322662,102.61956 24.601519,99.776463 C 19.225421,96.538956 17.369413,91.741154 17.621345,81.732632 C 17.78083,75.396835 17.297536,71.093691 15.794836,65.469737 C 13.38634,56.455791 13.82,52.944489 17.616516,50.719769 C 19.063909,49.871611 24.769691,47.179405 30.296033,44.737088 C 37.409114,41.593526 40.624681,39.697365 41.305143,38.245219 C 41.992829,36.77765 42.203737,33.867969 40.57434,28.286206 C 36.592772,14.6467 40.081451,9.2361905 49.839332,9.2361905 C 59.597214,9.2361905 63.429892,14.937624 59.104325,28.286206 C 57.307519,33.831098 57.685835,36.77765 58.373522,38.245219 C 59.053984,39.697365 62.269551,41.593526 69.382633,44.737088 C 74.908976,47.179405 80.614757,49.871611 82.062147,50.719769 C 85.858667,52.944489 86.292317,56.455791 83.883817,65.469737 C 82.381127,71.093691 81.897837,75.396835 82.057317,81.732632 C 82.309247,91.741154 80.453237,96.538956 75.077146,99.776463 C 70.356003,102.61956 69.040803,105.98738 70.37309,111.82215 C 70.973696,114.4525 71.642498,122.36687 71.649112,129.58743 C 71.659183,140.59465 71.13737,143.98797 69.31196,149.83556 C 67.30923,156.25117 66.864688,157.90897 67.797062,170.34849 C 68.684958,182.19476 68.501242,184.26188 66.769075,191.68194 C 64.685501,200.60734 63.581512,219.60387 66.780486,223.03797 C 66.780486,223.03797 70.720195,223.2637 75.311719,223.70493 C 79.903235,224.14616 85.331807,224.95806 87.366447,225.53163 C 88.914437,225.96802 91.244957,226.70155 91.244957,226.70155 L 91.634577,239.03157 L 95.477127,240.00521 C 100.78918,241.52608 101.12532,241.74973 97.379277,243.56494 C 95.489707,244.48057 95.782867,244.4595 95.782867,244.4595 C 95.782867,244.4595 3.1991929,244.08353 2.2993819,243.56494 z"    />  </g></svg>';
    var awards_svg = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.001 512.001" style="enable-background:new 0 0 512.001 512.001;" xml:space="preserve"><path style="fill:#F9AC30;" d="M227.117,383.98h-46.308c-16.987,0-30.758,13.771-30.758,30.758v34.25h211.906v-34.25 c0-16.987-13.771-30.758-30.758-30.758h-46.308H227.117z"></path><path style="fill:#DD8D19;" d="M491.157,70.23c-15.917-24.944-43.818-38.67-78.545-38.67h-0.902H100.3h-0.902 c-34.738,0-62.628,13.725-78.545,38.67c-17.196,26.947-17.636,62.691-1.206,98.089c30.197,65.029,125.456,86.713,129.503,87.604 l9.269,2.045h0.01H353.57h0.01l9.279-2.045c4.037-0.891,99.306-22.575,129.493-87.604C508.783,132.921,508.343,97.177,491.157,70.23 z M463.822,155.066c-12.1,26.056-40.379,43.671-61.978,53.852c-8.912,4.205-17.395,7.497-24.577,9.992l-242.523,0.01h-0.01 c-7.193-2.506-15.675-5.798-24.577-10.003c-21.589-10.181-49.878-27.796-61.978-53.852c-11.817-25.448-12.11-50.203-0.807-67.913 c9.93-15.571,28.415-24.137,52.028-24.137h0.933h311.348h0.933c23.613,0,42.088,8.566,52.028,24.137 C475.933,104.863,475.639,129.618,463.822,155.066z"></path><path style="fill:#F9AC30;" d="M278.024,383.98l-0.047-30.532c-0.034-21.96,11.352-42.511,30.284-53.637 c60.287-35.43,103.444-130.412,103.444-242.04V0H100.297v57.769c0,111.63,43.159,206.615,103.448,242.042 c18.931,11.125,30.317,31.675,30.284,53.633l-0.045,30.535l25.164,26.053L278.024,383.98z"></path><g><path style="fill:#DD8D19;" d="M245.486,353.447l-0.021,30.533h-11.481l0.042-30.533c0.031-21.956-11.356-42.507-30.281-53.632 c-60.29-35.43-103.447-130.415-103.447-242.041V0h81.198v57.774c0,111.626,20.656,206.611,49.501,242.041 C240.055,310.939,245.507,331.49,245.486,353.447z"></path><path style="fill:#DD8D19;" d="M247.916,383.98h-20.797H180.81c-16.987,0-30.758,13.771-30.758,30.758v34.25h67.105v-34.25 C217.157,397.751,230.928,383.98,247.916,383.98z"></path></g><path style="fill:#4F5B5E;" d="M219.114,432.212h-80.945c-9.652,0-17.476,7.824-17.476,17.476v62.314h270.624v-62.314 c0-9.652-7.824-17.476-17.476-17.476h-80.945"></path><path style="fill:#3B4547;" d="M159.138,432.212h-20.97c-9.652,0-17.476,7.824-17.476,17.476v62.314h20.97v-62.314 C141.664,440.036,149.487,432.212,159.138,432.212z"></path></svg>';    
    var tmdb_svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 185.04 133.4"><defs><style>.cls-1{fill:url(#linear-gradient);}</style><linearGradient id="linear-gradient" y1="66.7" x2="185.04" y2="66.7" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#90cea1"/><stop offset="0.56" stop-color="#3cbec9"/><stop offset="1" stop-color="#00b3e5"/></linearGradient></defs><title>Asset 4</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M51.06,66.7h0A17.67,17.67,0,0,1,68.73,49h-.1A17.67,17.67,0,0,1,86.3,66.7h0A17.67,17.67,0,0,1,68.63,84.37h.1A17.67,17.67,0,0,1,51.06,66.7Zm82.67-31.33h32.9A17.67,17.67,0,0,0,184.3,17.7h0A17.67,17.67,0,0,0,166.63,0h-32.9A17.67,17.67,0,0,0,116.06,17.7h0A17.67,17.67,0,0,0,133.73,35.37Zm-113,98h63.9A17.67,17.67,0,0,0,102.3,115.7h0A17.67,17.67,0,0,0,84.63,98H20.73A17.67,17.67,0,0,0,3.06,115.7h0A17.67,17.67,0,0,0,20.73,133.37Zm83.92-49h6.25L125.5,49h-8.35l-8.9,23.2h-.1L99.4,49H90.5Zm32.45,0h7.8V49h-7.8Zm22.2,0h24.95V77.2H167.1V70h15.35V62.8H167.1V56.2h16.25V49h-24ZM10.1,35.4h7.8V6.9H28V0H0V6.9H10.1ZM39,35.4h7.8V20.1H61.9V35.4h7.8V0H61.9V13.2H46.75V0H39Zm41.25,0h25V28.2H88V21h15.35V13.8H88V7.2h16.25V0h-24Zm-79,49H9V57.25h.1l9,27.15H24l9.3-27.15h.1V84.4h7.8V49H29.45l-8.2,23.1h-.1L13,49H1.2Zm112.09,49H126a24.59,24.59,0,0,0,7.56-1.15,19.52,19.52,0,0,0,6.35-3.37,16.37,16.37,0,0,0,4.37-5.5A16.91,16.91,0,0,0,146,115.8a18.5,18.5,0,0,0-1.68-8.25,15.1,15.1,0,0,0-4.52-5.53A18.55,18.55,0,0,0,133.07,99,33.54,33.54,0,0,0,125,98H113.29Zm7.81-28.2h4.6a17.43,17.43,0,0,1,4.67.62,11.68,11.68,0,0,1,3.88,1.88,9,9,0,0,1,2.62,3.18,9.87,9.87,0,0,1,1,4.52,11.92,11.92,0,0,1-1,5.08,8.69,8.69,0,0,1-2.67,3.34,10.87,10.87,0,0,1-4,1.83,21.57,21.57,0,0,1-5,.55H121.1Zm36.14,28.2h14.5a23.11,23.11,0,0,0,4.73-.5,13.38,13.38,0,0,0,4.27-1.65,9.42,9.42,0,0,0,3.1-3,8.52,8.52,0,0,0,1.2-4.68,9.16,9.16,0,0,0-.55-3.2,7.79,7.79,0,0,0-1.57-2.62,8.38,8.38,0,0,0-2.45-1.85,10,10,0,0,0-3.18-1v-.1a9.28,9.28,0,0,0,4.43-2.82,7.42,7.42,0,0,0,1.67-5,8.34,8.34,0,0,0-1.15-4.65,7.88,7.88,0,0,0-3-2.73,12.9,12.9,0,0,0-4.17-1.3,34.42,34.42,0,0,0-4.63-.32h-13.2Zm7.8-28.8h5.3a10.79,10.79,0,0,1,1.85.17,5.77,5.77,0,0,1,1.7.58,3.33,3.33,0,0,1,1.23,1.13,3.22,3.22,0,0,1,.47,1.82,3.63,3.63,0,0,1-.42,1.8,3.34,3.34,0,0,1-1.13,1.2,4.78,4.78,0,0,1-1.57.65,8.16,8.16,0,0,1-1.78.2H165Zm0,14.15h5.9a15.12,15.12,0,0,1,2.05.15,7.83,7.83,0,0,1,2,.55,4,4,0,0,1,1.58,1.17,3.13,3.13,0,0,1,.62,2,3.71,3.71,0,0,1-.47,1.95,4,4,0,0,1-1.23,1.3,4.78,4.78,0,0,1-1.67.7,8.91,8.91,0,0,1-1.83.2h-7Z"/></g></g></svg>';
    var imdb_svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" viewBox="0 0 575 289.83" width="575" height="289.83"><defs><path d="M575 24.91C573.44 12.15 563.97 1.98 551.91 0C499.05 0 76.18 0 23.32 0C10.11 2.17 0 14.16 0 28.61C0 51.84 0 237.64 0 260.86C0 276.86 12.37 289.83 27.64 289.83C79.63 289.83 495.6 289.83 547.59 289.83C561.65 289.83 573.26 278.82 575 264.57C575 216.64 575 48.87 575 24.91Z" id="d1pwhf9wy2"></path><path d="M69.35 58.24L114.98 58.24L114.98 233.89L69.35 233.89L69.35 58.24Z" id="g5jjnq26yS"></path><path d="M201.2 139.15C197.28 112.38 195.1 97.5 194.67 94.53C192.76 80.2 190.94 67.73 189.2 57.09C185.25 57.09 165.54 57.09 130.04 57.09L130.04 232.74L170.01 232.74L170.15 116.76L186.97 232.74L215.44 232.74L231.39 114.18L231.54 232.74L271.38 232.74L271.38 57.09L211.77 57.09L201.2 139.15Z" id="i3Prh1JpXt"></path><path d="M346.71 93.63C347.21 95.87 347.47 100.95 347.47 108.89C347.47 115.7 347.47 170.18 347.47 176.99C347.47 188.68 346.71 195.84 345.2 198.48C343.68 201.12 339.64 202.43 333.09 202.43C333.09 190.9 333.09 98.66 333.09 87.13C338.06 87.13 341.45 87.66 343.25 88.7C345.05 89.75 346.21 91.39 346.71 93.63ZM367.32 230.95C372.75 229.76 377.31 227.66 381.01 224.67C384.7 221.67 387.29 217.52 388.77 212.21C390.26 206.91 391.14 196.38 391.14 180.63C391.14 174.47 391.14 125.12 391.14 118.95C391.14 102.33 390.49 91.19 389.48 85.53C388.46 79.86 385.93 74.71 381.88 70.09C377.82 65.47 371.9 62.15 364.12 60.13C356.33 58.11 343.63 57.09 321.54 57.09C319.27 57.09 307.93 57.09 287.5 57.09L287.5 232.74L342.78 232.74C355.52 232.34 363.7 231.75 367.32 230.95Z" id="a4ov9rRGQm"></path><path d="M464.76 204.7C463.92 206.93 460.24 208.06 457.46 208.06C454.74 208.06 452.93 206.98 452.01 204.81C451.09 202.65 450.64 197.72 450.64 190C450.64 185.36 450.64 148.22 450.64 143.58C450.64 135.58 451.04 130.59 451.85 128.6C452.65 126.63 454.41 125.63 457.13 125.63C459.91 125.63 463.64 126.76 464.6 129.03C465.55 131.3 466.03 136.15 466.03 143.58C466.03 146.58 466.03 161.58 466.03 188.59C465.74 197.84 465.32 203.21 464.76 204.7ZM406.68 231.21L447.76 231.21C449.47 224.5 450.41 220.77 450.6 220.02C454.32 224.52 458.41 227.9 462.9 230.14C467.37 232.39 474.06 233.51 479.24 233.51C486.45 233.51 492.67 231.62 497.92 227.83C503.16 224.05 506.5 219.57 507.92 214.42C509.34 209.26 510.05 201.42 510.05 190.88C510.05 185.95 510.05 146.53 510.05 141.6C510.05 131 509.81 124.08 509.34 120.83C508.87 117.58 507.47 114.27 505.14 110.88C502.81 107.49 499.42 104.86 494.98 102.98C490.54 101.1 485.3 100.16 479.26 100.16C474.01 100.16 467.29 101.21 462.81 103.28C458.34 105.35 454.28 108.49 450.64 112.7C450.64 108.89 450.64 89.85 450.64 55.56L406.68 55.56L406.68 231.21Z" id="fk968BpsX"></path></defs><g><g><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill="#f6c700" fill-opacity="1"></use><g><use xlink:href="#d1pwhf9wy2" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#g5jjnq26yS" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#g5jjnq26yS" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#i3Prh1JpXt" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#a4ov9rRGQm" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g><g><use xlink:href="#fk968BpsX" opacity="1" fill="#000000" fill-opacity="1"></use><g><use xlink:href="#fk968BpsX" opacity="1" fill-opacity="0" stroke="#000000" stroke-width="1" stroke-opacity="0"></use></g></g></g></g></svg>';
    var kp_svg = '<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="120" height="120" fill="black"/><path d="M120 0L31.5771 47.3297L77.6571 0H52.1143L20.7429 43.5446V0H0V120H20.7429V76.5257L52.1143 120H77.6571L32.7737 74.1583L120 120V97.7143L40.4434 65.7977L120 71.1429V48.8571L40.9474 53.9966L120 22.2857V0Z" fill="url(#paint0_radial_4902_370)"/><defs><radialGradient id="paint0_radial_4902_370" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="rotate(45) scale(169.706)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>';
    var rt_svg = '<svg id="svg2" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="142.5" viewBox="0 0 143.75 142.5" width="143.75" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"> <metadata id="metadata8">  <rdf:RDF>   <cc:Work rdf:about="">    <dc:format>image/svg+xml</dc:format>    <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>    <dc:title/>   </cc:Work>  </rdf:RDF> </metadata> <g id="layer1">  <path id="path3495" d="m36.984 2.8681-8.605 7.0948 11.704 10.114c-14.776-5.554-27.219 7.873-28.176 13.146 7.782-1.816 12.59-2.372 18.801-1.882-39.592 26.053-27.984 73.919-8.065 90.479 32.519 25.93 77.417 18 100.69-7.4 33.93-36.423 9.94-107.9-58.269-96.004 0.597-6.577 3.558-8.4485 6.989-9.0035-5.004-8.3923-20.631-4.129-25.618 7.7215-0.151 0.358-9.448-14.266-9.448-14.266z" fill="#f93208"/> </g> <path id="path3509" d="m122.25 126.31v4.6562h1.375v-4.6562l1.5-0.008v-1.3125l-4.4141-0.0195 0.00005 1.332z" fill="#f93208"/> <g id="g3714">  <path id="path3511" d="m127.48 125.02-1.2813 0.0156v5.9688h1.3594v-3.25l1.7656 2.4688v-2.4062zm3.6992 0.008-1.8555 2.793-0.008 2.4062 1.7852-2.4648v3.25h1.3594v-5.9688z" fill="#f93208"/></g> <g id="layer2">  <g id="g3580" fill="#fff" transform="matrix(.33241 0 0 .33241 106.85 43.6)">   <path id="path3580" d="m-58.803 89.458-22.078 0.2659h-23.141v-24.742-24.742l69.978 0.32551c38.487 0.17903 71.638-0.14101 71.638-0.14101l0.46355 49.256-23.943-0.39885h-22.48v63.696 63.962h-24.685l-25.748-0.2659c-0.000293-44.258-0.0036-81.844-0.0036-127.22z"/>   <path id="path3619" d="m-220.7 175.11-13.892-0.1806v-87.709-87.709h41.908c45.203 0 49.02 0.21732 60.054 3.419 17.906 5.1956 31.575 16.455 39.108 32.213 3.6631 7.6624 5.0989 13.79 5.4749 23.367 0.84948 21.642-8.3313 40.459-24.584 50.391-4.8682 2.9749-5.0947 3.2102-4.3022 4.4697 2.1387 3.3989 35.93 61.595 35.93 61.881 0 0.17761-12.896 0.32291-28.657 0.32291h-28.657l-16.634-28.013c-9.1486-15.407-16.986-28.495-17.416-29.082-0.58267-0.79684-2.0664-1.1577-5.8174-1.4148l-5.0353-0.34512 0.31448 29.427 0.31449 29.427-12.108-0.14346c-6.6594-0.0788-18.36-0.22479-26-0.32411zm61.863-97.862c11.726-2.467 17.722-8.0859 18.379-17.22 0.45852-6.387-1.0591-10.745-5.1178-14.697-5.3791-5.2375-12.887-7.0524-29.328-7.0889l-8.6782-0.01924 0.40567 5.715c0.22313 3.1432 0.40566 12.317 0.40566 20.387v14.672l9.8334-0.42512c5.4084-0.23383 11.754-0.82913 14.101-1.3229z"/>  </g> </g></svg>';
    var mc_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><circle fill="#001B36" stroke="#FC0" stroke-width="4.6" cx="44" cy="44" r="41.6"/><path transform="translate(-10,-961) matrix(1.2756629,-1.3487733,1.3685717,1.2634987,-267.04706,1066.0743)" fill="#FFF"d="m126.73438,92.087002 5.05859,0 0,2.832031 c 1.80989-2.200501 3.96483-3.30076 6.46484-3.300781 1.32811,2.1e-5 2.48045,.273458 3.45703,.820312 .97655,.546895 1.77733,1.373717 2.40235,2.480469 .91144-1.106752 1.89451-1.933574 2.94922-2.480469 1.05466-0.546854 2.18096-0.820291 3.3789-0.820312 1.52341,2.1e-5 2.81247,.309265 3.86719,.927734 1.05466,.618509 1.84242,1.526711 2.36328,2.724609 .37757,.885434 .56637,2.317724 .56641,4.296875 l 0,13.26172-5.48828,0 0-11.85547 c-3e-5-2.057277-0.18883-3.385401-0.56641-3.984375-0.50784-0.781233-1.28909-1.171858-2.34375-1.171875-0.76825,1.7e-5-1.49091,.234392-2.16797,.703125-0.6771,.468766-1.16538,1.155614-1.46484,2.060547-0.2995,.904961-0.44924,2.333998-0.44922,4.287108 l 0,9.96094-5.48828,0 0-11.36719 c-2e-5-2.018214-0.0977-3.320296-0.29297-3.906248-0.19533-0.585922-0.49806-1.02212-0.9082-1.308594-0.41017-0.286442-0.96681-0.429671-1.66993-0.429688-0.84636,1.7e-5-1.60808,.227882-2.28515,.683594-0.6771,.455745-1.16212,1.113297-1.45508,1.972656-0.29298,.859389-0.43946,2.28517-0.43945,4.27734 l 0,10.07813-5.48828,0z"/></svg>';

    
    Lampa.Lang.add({
        maxsm_ratings_plugin: {
            ru: 'Рейтинг',
            en: 'Rating',
            uk: 'Рейтинг',
            be: 'Рэйтынг',
            pt: 'Classificação',
            zh: '评分',
            he: 'דירוג',
            cs: 'Hodnocení',
            bg: 'Рейтинг'
        },
        maxsm_ratings_plugin_mode: {
            ru: 'Режим',
            en: 'Mode',
            uk: 'Режим',
            be: 'Рэжым',
            pt: 'Modo',
            zh: '模式',
            he: 'מצב',
            cs: 'Režim',
            bg: 'Режим'
        },
        maxsm_ratings_plugin_mode_normal: {
            ru: 'Нормальный',
            en: 'Normal',
            uk: 'Нормальний',
            be: 'Звычайны',
            pt: 'Normal',
            zh: '正常',
            he: 'רגיל',
            cs: 'Normální',
            bg: 'Нормален'
        },
        maxsm_ratings_plugin_mode_noavg: {
            ru: 'Без среднего рейтинга',
            en: 'No average',
            uk: 'Без середнього рейтингу',
            be: 'Без сярэдняга рэйтынгу',
            pt: 'Sem média',
            zh: '无平均值',
            he: 'ללא ממוצע',
            cs: 'Bez průměru',
            bg: 'Без среден рейтинг'
        },
        maxsm_ratings_plugin_icons: {
            ru: 'Значки',
            en: 'Icons',
            uk: 'Значки',
            be: 'Значкі',
            pt: 'Ícones',
            zh: '图标',
            he: 'סמלים',
            cs: 'Ikony',
            bg: 'Икони'
        },
        maxsm_ratings_plugin_colors: {
            ru: 'Цвета',
            en: 'Colors',
            uk: 'Кольори',
            be: 'Колеры',
            pt: 'Cores',
            zh: '颜色',
            he: 'צבעים',
            cs: 'Barvy',
            bg: 'Цветове'
        },
        maxsm_ratings_plugin_avg: {
            ru: 'ИТОГ',
            en: 'TOTAL',
            uk: 'ПІДСУМОК',
            be: 'ВЫНІК',
            pt: 'TOTAL',
            zh: '总评',
            he: 'סה"כ',
            cs: 'VÝSLEDEK',
            bg: 'РЕЗУЛТАТ'
        },
        maxsm_ratings_plugin_simplemode: {
            ru: 'Только средняя оценка',
            en: 'Only average rating',
            uk: 'Лише середня оцінка',
            be: 'Толькі сярэдняя ацэнка',
            pt: 'Apenas avaliação média',
            zh: '仅显示平均评分',
            he: 'רק דירוג ממוצע',
            cs: 'Pouze průměrné hodnocení',
            bg: 'Само средна оценка'
        },
        maxsm_ratings_plugin_avg_simple: {
            ru: 'Оценка',
            en: 'Rating',
            uk: 'Оцінка',
            be: 'Ацэнка',
            pt: 'Avaliação',
            zh: '评分',
            he: 'דירוג',
            cs: 'Hodnocení',
            bg: 'Оценка'
        },
        maxsm_ratings_plugin_loading: {
            ru: 'Загрузка',
            en: 'Loading',
            uk: 'Завантаження',
            be: 'Загрузка',
            pt: 'Carregando',
            zh: '加载中',
            he: 'טוען',
            cs: 'Načítání',
            bg: 'Зареждане'
        },
        maxsm_ratings_plugin_oscars: { 
            ru: 'Оскар',
            en: 'Oscar',
            uk: 'Оскар',
            be: 'Оскар',
            pt: 'Oscar',
            zh: '奥斯卡奖',
            he: 'אוסקר',
            cs: 'Oscar',
            bg: 'Оскар'
        },
        maxsm_ratings_plugin_awards: {
            ru: 'Награды',
            en: 'Awards',
            uk: 'Нагороди',
            be: 'Узнагароды',
            pt: 'Prêmios',
            zh: '奖项',
            he: 'פרסים',
            cs: 'Ocenění',
            bg: 'Награди'
        }
    });

    // Стили
    var style = "<style id=\"maxsm_ratings_plugin\">" +
        ".full-start-new__rate-line {" +
        "visibility: hidden;" +
        "flex-wrap: wrap;" +
        " gap: 0.4em 0;" +
        "}" +
        ".full-start-new__rate-line > * {" +
        "    margin-left: 0 !important;" +
        "    margin-right: 0.6em !important;" +
        "}" +
        ".rate--green  { color: #4caf50; }" +
        ".rate--lime   { color: #cddc39; }" +
        ".rate--orange { color: #ff9800; }" +
        ".rate--red    { color: #f44336; }" +
        ".rate--gold   { color: gold;    }" +
        ".rate--icon    { height: 1.8em; }" +
        ".full-start__rate > div:last-child { padding: 0.2em 0.4em; }" +
        "</style>";
    
    Lampa.Template.add('maxsm_ratings_plugin_css', style);
    $('body').append(Lampa.Template.get('maxsm_ratings_plugin_css', {}, true));
        
    var loadingStyles = "<style id=\"maxsm_ratings_plugin_loading_animation\">" +
                    ".loading-dots-container {" +
                    "    position: absolute;" +
                    "    top: 50%;" +
                    "    left: 0;" +
                    "    right: 0;" +
                    "    text-align: left;" +
                    "    transform: translateY(-50%);" +
                    "    z-index: 10;" +
                    "}" +
                    ".full-start-new__rate-line {" +
                    "    position: relative;" +
                    "}" +
                    ".loading-dots {" +
                    "    display: inline-flex;" +
                    "    align-items: center;" +
                    "    gap: 0.4em;" +
                    "    color: #ffffff;" +
                    "    font-size: 1em;" +
                    "    background: rgba(0, 0, 0, 0.3);" +
                    "    padding: 0.6em 1em;" +
                    "    border-radius: 0.5em;" +
                    "}" +
                    ".loading-dots__text {" +
                    "    margin-right: 1em;" +
                    "}" +
                    ".loading-dots__dot {" +
                    "    width: 0.5em;" +
                    "    height: 0.5em;" +
                    "    border-radius: 50%;" +
                    "    background-color: currentColor;" +
                    "    opacity: 0.3;" +
                    "    animation: loading-dots-fade 1.5s infinite both;" + // Увеличил длительность для плавности
                    "}" +
                    ".loading-dots__dot:nth-child(1) {" +
                    "    animation-delay: 0s;" +
                    "}" +
                    ".loading-dots__dot:nth-child(2) {" +
                    "    animation-delay: 0.5s;" + // Задержка = 1/3 от 1.5s
                    "}" +
                    ".loading-dots__dot:nth-child(3) {" +
                    "    animation-delay: 1s;" +    // Задержка = 2/3 от 1.5s
                    "}" +
                    "@keyframes loading-dots-fade {" +
                    "    0%, 90%, 100% { opacity: 0.3; }" + // Точка тусклая в начале, после 33% и в конце
                    "    35% { opacity: 1; }" +             // Пик яркости на середине своего отрезка
                    "}" +
                    "</style>";


    Lampa.Template.add('maxsm_ratings_plugin_loading_animation_css', loadingStyles);
    $('body').append(Lampa.Template.get('maxsm_ratings_plugin_loading_animation_css', {}, true));
    
    // Конфигурация
    var CACHE_TIME = 3 * 24 * 60 * 60 * 1000; // 3 дня
    var OMDB_CACHE = 'maxsm_ratings_plugin_omdb';
    var KP_CACHE = 'maxsm_ratings_plugin_kp';
    var ID_MAPPING_CACHE = 'maxsm_ratings_plugin_id_mapping';
    var OMDB_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS) || ['YOU_KEY'];
    var KP_API_KEYS   = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.KP_API_KEYS)   || ['YOU_KEY'];
    var PROXY_TIMEOUT = 5000; // 5 секунд таймаут для каждого прокси
    var PROXY_LIST = [
        'https://api.allorigins.win/raw?url=',  
        'https://open.corsproxy.io/?url=',
        'https://corsproxy.io/?',               
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors.bwa.workers.dev/'
    ];
    
    // Словарь возрастных рейтингов
    var AGE_RATINGS = {
        'G': '3+',
        'PG': '6+',
        'PG-13': '13+',
        'R': '17+',
        'NC-17': '18+',
        'TV-Y': '0+',
        'TV-Y7': '7+',
        'TV-G': '3+',
        'TV-PG': '6+',
        'TV-14': '14+',
        'TV-MA': '17+'
    };
    
    // Весовые коэффициенты
    var WEIGHTS = {
        imdb: 0.35,
        tmdb: 0.15,
        kp: 0.20,
        mc: 0.15,
        rt: 0.15
    };
    
    // Берем случайный токен из массива
    function getRandomToken(arr) {
      if (!arr || !arr.length) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }
    
    // Получаем количество Оскаров и других выигранных наград
    function parseAwards(awardsText) {
        if (typeof awardsText !== 'string') return null;
        console.log("MAXSM-RATINGS: Parse awards: " + awardsText);
    
        var result = {
            oscars: 0,
            awards: 0
        };
    
        var oscarMatch = awardsText.match(/Won (\d+) Oscars?/i);
        if (oscarMatch && oscarMatch[1]) {
            result.oscars = parseInt(oscarMatch[1], 10);
            console.log("MAXSM-RATINGS: Oscars: " + result.oscars);
        }
    
        var otherMatch = awardsText.match(/Another (\d+) wins?/i);
        if (otherMatch && otherMatch[1]) {
            result.awards = parseInt(otherMatch[1], 10);
            console.log("MAXSM-RATINGS: Awards (Another): " + result.awards);
        }
    
        if (result.awards === 0) {
            var simpleMatch = awardsText.match(/(\d+) wins?/i);
            if (simpleMatch && simpleMatch[1]) {
                result.awards = parseInt(simpleMatch[1], 10);
                console.log("MAXSM-RATINGS: Awards (Simple): " + result.awards);
            }
        }
    
        return result;
    }
    
    // Получение данных через прокси, для KP
    function fetchWithProxy(url, callback) {
        var currentProxy = 0;
        
        function tryNextProxy() {
            if (currentProxy >= PROXY_LIST.length) {
                callback(new Error('All proxies failed'));
                return;
            }
            
            var proxyUrl = PROXY_LIST[currentProxy] + encodeURIComponent(url);
            console.log("MAXSM-RATINGS: Fetch with proxy: " + proxyUrl);
            
            var timeoutId = setTimeout(function() {
                // Если запрос не завершился за PROXY_TIMEOUT, переходим к следующему прокси
                currentProxy++;
                tryNextProxy();
            }, PROXY_TIMEOUT);
            
            fetch(proxyUrl)
                .then(function(response) {
                    clearTimeout(timeoutId); // Отменяем таймаут, если ответ получен
                    if (!response.ok) throw new Error('Proxy error: ' + response.status);
                    return response.text();
                })
                .then(function(data) {
                    clearTimeout(timeoutId); // На всякий случай
                    callback(null, data);
                })
                .catch(function() {
                    clearTimeout(timeoutId);
                    currentProxy++;
                    tryNextProxy();
                });
        }
        
        tryNextProxy();
    }
    
    // Получение данных с КП
    function getKinopoiskRatingByNormalizedCard(normalizedCard, apiKey, callback) {
        console.log("MAXSM-RATINGS: Get KP ratings");
        console.log("MAXSM-RATINGS: Get KP inf");
        var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:\-–—]/g, ' ').trim();
        var year = '';
        if (normalizedCard.release_date && typeof normalizedCard.release_date === 'string') {
            year = normalizedCard.release_date.split('-')[0];
        }
        
        if (!year) {
            callback(null);
            return;
        }
        
        var encodedTitle = encodeURIComponent(queryTitle);
        var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodedTitle;
        
        fetch(searchUrl, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP error: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            if (!data.films || !data.films.length) {
                callback(null);
                return;
            }
            
            // Ищем лучший матч: сначала по imdb_id, потом по году
            var bestMatch = null;
            console.log("MAXSM-RATINGS: Match KP inf");
            for (var j = 0; j < data.films.length; j++) {
                var film2 = data.films[j];
                if (film2.year && String(film2.year).indexOf(String(year)) === 0) {
                    bestMatch = film2;
                    console.log("MAXSM-RATINGS: KP best match for: " + queryTitle + " / " + year + " is id: " + bestMatch.filmId  + " / " + film2.nameRu + " / " + film2.nameEn + " / " + film2.year);
                    break;
                }
            }
            
            if (!bestMatch || !bestMatch.filmId) {
                callback(null);
                return;
            }
            
            var xmlUrl = 'https://rating.kinopoisk.ru/' + bestMatch.filmId + '.xml';
            
            fetchWithProxy(xmlUrl, function(error, xmlText) {
                console.log("MAXSM-RATINGS: Try to get KP ratings from XML");
                if (!error && xmlText) {
                    // Изменения в блоке XML-парсинга:
                    try {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xmlText, "text/xml");
                        var kpRatingNode = xmlDoc.getElementsByTagName("kp_rating")[0];
                        var imdbRatingNode = xmlDoc.getElementsByTagName("imdb_rating")[0];
                        
                        // Преобразуем строки в числа и проверяем, что они > 0
                        var kpRating = kpRatingNode ? parseFloat(kpRatingNode.textContent) : null;
                        var imdbRating = imdbRatingNode ? parseFloat(imdbRatingNode.textContent) : null;
                        
                        // Проверяем, что значения являются числами и больше 0
                        var hasValidKp = !isNaN(kpRating) && kpRating > 0;
                        var hasValidImdb = !isNaN(imdbRating) && imdbRating > 0;
                        
                        if (hasValidKp || hasValidImdb) {
                            console.log("MAXSM-RATINGS: Got KP ratings from XML");
                            return callback({
                                kinopoisk: hasValidKp ? kpRating : null,
                                imdb: hasValidImdb ? imdbRating : null
                            });
                        }
                    } catch (e) {
                        console.log("MAXSM-RATINGS: XML parse error, fallback to API");
                    }
                }
                
                // Если XML не сработал, пробуем API
                console.log("MAXSM-RATINGS: Try to get KP ratings from API");
                fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + bestMatch.filmId, {
                    headers: { 'X-API-KEY': apiKey }
                })
                    .then(function(response) {
                        if (!response.ok) throw new Error('API error');
                        return response.json();
                    })
                    .then(function(data) {
                        console.log("MAXSM-RATINGS: Got KP ratings from API");
                        callback({
                            kinopoisk: data.ratingKinopoisk || null,
                            imdb: data.ratingImdb || null
                        });
                    })
                    .catch(function() {
                        callback(null);
                    });
            });
        })
        .catch(function() {
            callback(null);
        });
    }

    function addLoadingAnimation() {
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;

        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length || $('.loading-dots-container', rateLine).length) return;

        rateLine.append(
            '<div class="loading-dots-container">' +
                '<div class="loading-dots">' +
                    '<span class="loading-dots__text">' + Lampa.Lang.translate("maxsm_ratings_plugin_loading") + '</span>' +
                    '<span class="loading-dots__dot"></span>' +
                    '<span class="loading-dots__dot"></span>' +
                    '<span class="loading-dots__dot"></span>' +
                '</div>' +
            '</div>'
        );

        $('.loading-dots-container', rateLine).css({
            'opacity': '1',
            'visibility': 'visible'
        });
    }

    function removeLoadingAnimation() {
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;

        $('.loading-dots-container', render).remove();
    }
    
    // Вспомогательные функции
    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return card.name || card.original_name ? 'tv' : 'movie';
    }
    
    function getRatingClass(rating) {
        if (rating >= 8.5) return 'rate--green';
        if (rating >= 7.0) return 'rate--lime';
        if (rating >= 5.0) return 'rate--orange';
        return 'rate--red';
    }
    
    // Основная функция
    function fetchAdditionalRatings(card) {
        console.log("MAXSM-RATINGS: Fetch additional ratings");
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;
    
        var normalizedCard = {
            id: card.id,
            //kp_id: card.kp_id || card.kinopoisk_id || card.kinopoiskId || card.filmId,
            imdb_id: card.imdb_id || card.imdb || null,
            title: card.title || card.name || '',
            original_title: card.original_title || card.original_name || '',
            type: getCardType(card),
            release_date: card.release_date || card.first_air_date || ''
        };
        
        console.log("MAXSM-RATINGS: Card id: " + normalizedCard.id + " imdb id: " + normalizedCard.imdb_id + " title: " + normalizedCard.title + " orig: " + normalizedCard.original_title + " type: " + normalizedCard.type + " date: " + normalizedCard.release_date);
        
        var rateLine = $('.full-start-new__rate-line', render);
        if (rateLine.length) {
            rateLine.css('visibility', 'hidden');
            addLoadingAnimation();
        }
        
        var cacheKey = normalizedCard.type + '_' + (normalizedCard.imdb_id || normalizedCard.id);
        var cachedData = getOmdbCache(cacheKey);
        var cachedKpData = getKpCache(cacheKey);
        var ratingsData = {};
        
        // Статусы рейтингов
        var kpElement = $('.rate--kp:not(.hide)', render);
        var imdbElement = $('.rate--imdb:not(.hide)', render);
        
        // Проверяем, что оба рейтинга уже есть и содержат числовые значения
        var kpExists = kpElement.length > 0 && !!kpElement.find('> div').eq(0).text().trim();
        var imdbExists = imdbElement.length > 0 && !!imdbElement.find('> div').eq(0).text().trim();
        
        // Если есть оба - пропускаем запрос к KP API
        if (kpExists && imdbExists) {
            console.log("MAXSM-RATINGS: Skip KP ratings, allrady in card");
            processNextStep();
            return;
        }
                
        // 1. Обрабатываем кеш Кинопоиска
        if (cachedKpData) {
            ratingsData.kp = cachedKpData.kp;
            ratingsData.imdb_kp = cachedKpData.imdb; 
            console.log("MAXSM-RATINGS: Get KP ratings from cache");
            processNextStep();
        } else {
            getKinopoiskRatingByNormalizedCard(normalizedCard, getRandomToken(KP_API_KEYS), function(kpRatings) {
                if (kpRatings) {
                    if (kpRatings.kinopoisk) {
                        ratingsData.kp = kpRatings.kinopoisk;
                    }
                    if (kpRatings.imdb) {
                        ratingsData.imdb_kp = kpRatings.imdb; // если хочешь сохранить отдельно, или сравнить
                    }
                    saveKpCache(cacheKey, { kp: kpRatings.kinopoisk, imdb: kpRatings.imdb });
                }
                processNextStep();
            });
            return; // Выходим, продолжим в колбэке
        }
        
        function processNextStep() {
            updateHiddenElements(ratingsData);
            // 2. Обрабатываем кеш OMDB
            if (cachedData) {
                ratingsData.rt = cachedData.rt;
                ratingsData.mc = cachedData.mc;
                ratingsData.imdb = cachedData.imdb;
                ratingsData.ageRating = cachedData.ageRating;
                ratingsData.oscars = cachedData.oscars;
                ratingsData.awards = cachedData.awards;
                console.log("MAXSM-RATINGS: Get OMDB ratings from cache");
                updateUI();
            } else if (normalizedCard.imdb_id) {
                fetchOmdbRatings(normalizedCard, cacheKey, function(omdbData) {
                    if (omdbData) {
                        ratingsData.rt = omdbData.rt;
                        ratingsData.mc = omdbData.mc;
                        ratingsData.imdb = omdbData.imdb;
                        ratingsData.ageRating = omdbData.ageRating;
                        ratingsData.oscars = omdbData.oscars;
                        ratingsData.awards = omdbData.awards;
                        saveOmdbCache(cacheKey, omdbData);
                    }
                    updateUI();
                });
            } else {
                getImdbIdFromTmdb(normalizedCard.id, normalizedCard.type, function(newImdbId) {
                    if (newImdbId) {
                        normalizedCard.imdb_id = newImdbId;
                        cacheKey = normalizedCard.type + '_' + newImdbId;
                        fetchOmdbRatings(normalizedCard, cacheKey, function(omdbData) {
                            if (omdbData) {
                                ratingsData.rt = omdbData.rt;
                                ratingsData.mc = omdbData.mc;
                                ratingsData.imdb = omdbData.imdb;
                                ratingsData.ageRating = omdbData.ageRating;
                                ratingsData.oscars = omdbData.oscars;
                                ratingsData.awards = omdbData.awards;
                                saveOmdbCache(cacheKey, omdbData);
                            }
                            updateUI();
                        });
                    } else {
                        updateUI();
                    }
                });
            }
        }
        
        function updateUI() {
            // Вставляем рейтинги RT и MC
            insertRatings(ratingsData.rt, ratingsData.mc, ratingsData.oscars, ratingsData.awards);
            
            // Обновляем скрытые элементы
            updateHiddenElements(ratingsData);
            
            // Считаем и отображаем средний рейтинг
            if (parseInt(localStorage.getItem('maxsm_ratings_plugin_mode'), 10) !== 2)
                calculateAverageRating();
            
            //Меняем лейблы на иконки если надо
            var showIcons = localStorage.getItem('maxsm_ratings_plugin_icons')  === 'true';
            if (showIcons) insertIcons();
            
            // Убираем анимацию и возвращаем строку рейтингов     
            removeLoadingAnimation();
            rateLine.css('visibility', 'visible');
        }
    }
    
    //Меняем лейблы на иконки
    function insertIcons() {
        console.log("MAXSM-RATINGS: Insert icons");
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;   
        
        function replaceIcon(className, svg) {
            var Element = $('.' + className, render);
            if (Element.length) {
                var sourceNameElement = Element.find('.source--name');
                if (sourceNameElement.length) {
                    sourceNameElement.html(svg).addClass('rate--icon');
                } else {
                    // Если не нашли .source--name, пробуем найти второй дочерний div
                    var childDivs = Element.children('div');
                    if (childDivs.length >= 2) {
                        $(childDivs[1]).html(svg).addClass('rate--icon');
                    }
                }
            }
        }
        
        replaceIcon('rate--imdb', imdb_svg);
        replaceIcon('rate--kp', kp_svg);
        replaceIcon('rate--tmdb', tmdb_svg);
        replaceIcon('rate--oscars', oscars_svg);
        replaceIcon('rate--awards', awards_svg);
        replaceIcon('rate--rt', rt_svg);
        replaceIcon('rate--mc', mc_svg);
        replaceIcon('rate--avg', avg_svg);
    }
    
    // Функции работы с кешем
    function getOmdbCache(key) {
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }

    function saveOmdbCache(key, data) {
        // Проверяем валидные рейтинги
        var hasValidRating = (
            (data.rt && data.rt !== "N/A") ||
            (data.mc && data.mc !== "N/A") ||
            (data.imdb && data.imdb !== "N/A")
        );
        
        // Проверяем валидный возрастной рейтинг
        var hasValidAgeRating = (
            data.ageRating && 
            data.ageRating !== "N/A" && 
            data.ageRating !== "Not Rated"
        );
        
        // Также считаем наличие Оскаров поводом кешировать
        var hasOscars = typeof data.oscars === 'number' && data.oscars > 0;
        var hasAwards = typeof data.awards === 'number' && data.awards > 0;

        if (!hasValidRating && !hasValidAgeRating && !hasOscars&& !hasAwards) return;
        
        console.log("MAXSM-RATINGS: Save OMDB cache");
        
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        cache[key] = { 
            rt: data.rt,
            mc: data.mc,
            imdb: data.imdb,
            ageRating: data.ageRating,
            oscars: data.oscars || null,
            awards: data.awards || null,
            timestamp: Date.now() 
        };
        Lampa.Storage.set(OMDB_CACHE, cache);
    }

    // Функции для работы с кешем Кинопоиска
    function getKpCache(key) {
        var cache = Lampa.Storage.get(KP_CACHE) || {};
        var item = cache[key];
        return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null;
    }
    
    function saveKpCache(key, data) {
        if (!data || (!data.kp && !data.imdb)) return;
        
        console.log("MAXSM-RATINGS: Save KP cache");
    
        var cache = Lampa.Storage.get(KP_CACHE) || {};
    
        cache[key] = {
            kp: data.kp || null,
            imdb: data.imdb || null,
            timestamp: Date.now()
        };
    
        Lampa.Storage.set(KP_CACHE, cache);
    }
    
    function getImdbIdFromTmdb(tmdbId, type, callback) {
        console.log("MAXSM-RATINGS: Get IMDb id From TMDB");
        if (!tmdbId) return callback(null);
        
        var cleanType = type === 'movie' ? 'movie' : 'tv';
        var cacheKey = cleanType + '_' + tmdbId;
        var cache = Lampa.Storage.get(ID_MAPPING_CACHE) || {};
        
        if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TIME)) {
            return callback(cache[cacheKey].imdb_id);
        }
    
        var url = 'https://api.themoviedb.org/3/' + cleanType + '/' + tmdbId + '/external_ids?api_key=' + Lampa.TMDB.key();
    
        var makeRequest = function(url, success, error) {
            new Lampa.Reguest().silent(url, success, function() {
                new Lampa.Reguest().native(url, function(data) {
                    try {
                        success(typeof data === 'string' ? JSON.parse(data) : data);
                    } catch(e) {
                        error();
                    }
                }, error, false, { dataType: 'json' });
            });
        };
    
        makeRequest(url, function(data) {
            if (data && data.imdb_id) {
                cache[cacheKey] = {
                    imdb_id: data.imdb_id,
                    timestamp: Date.now()
                };
                Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                callback(data.imdb_id);
            } else {
                if (cleanType === 'tv') {
                    var altUrl = 'https://api.themoviedb.org/3/tv/' + tmdbId + '?api_key=' + Lampa.TMDB.key();
                    makeRequest(altUrl, function(altData) {
                        var imdbId = (altData && altData.external_ids && altData.external_ids.imdb_id) || null;
                        if (imdbId) {
                            cache[cacheKey] = {
                                imdb_id: imdbId,
                                timestamp: Date.now()
                            };
                            Lampa.Storage.set(ID_MAPPING_CACHE, cache);
                        }
                        callback(imdbId);
                    }, function() {
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            }
        }, function() {
            callback(null);
        });
    }

    // Модифицируем fetchOmdbRatings для поддержки callback
    function fetchOmdbRatings(card, cacheKey, callback) {
        console.log("MAXSM-RATINGS: Fetch OMDB ratings");
        
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;   
        
        // Статусы рейтингов
        var pgElement = $('.full-start__pg:not(.hide)', render);
        var imdbElement = $('.rate--imdb:not(.hide)', render);
        
        // Проверяем, что оба рейтинга уже есть и содержат числовые значения
        var pgExists = pgElement.length > 0 && !!pgElement.text().trim();
        var imdbExists = imdbElement.length > 0 && !!imdbElement.find('> div').eq(0).text().trim();

        // Проверяем тип контента (если 'tv' — пропускаем запрос)
        if (card.type === 'tv' && (pgExists && imdbExists)) {
            console.log("MAXSM-RATINGS: Skip fetching OMDB for TV show with PG and IMDB ratings");
            callback(null);
            return;
        }
        
        if (!card.imdb_id) {
            callback(null);
            return;
        }
        
        var url = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + card.imdb_id;
        
        new Lampa.Reguest().silent(url, function(data) {
            if (data && data.Response === 'True' && (data.Ratings || data.imdbRating)) {
                console.log("MAXSM-RATINGS: Got OMDB ratings from API");
                var parsedAwards = parseAwards(data.Awards || '');
                callback({
                    rt: extractRating(data.Ratings, 'Rotten Tomatoes'),
                    mc: extractRating(data.Ratings, 'Metacritic'),
                    imdb: data.imdbRating || null,
                    ageRating: data.Rated || null,
                    oscars: parsedAwards.oscars,
                    awards: parsedAwards.awards
                });
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }
    
    function updateHiddenElements(ratings) {
        console.log("MAXSM-RATINGS: Update hidden elements");
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;
        
        // Обновление возрастного рейтинга с проверкой "Not Rated"
        var pgElement = $('.full-start__pg.hide', render);
        if (pgElement.length && ratings.ageRating) {
            var invalidRatings = ['N/A', 'Not Rated', 'Unrated'];
            var isValid = invalidRatings.indexOf(ratings.ageRating) === -1;
            
            if (isValid) {
                console.log("MAXSM-RATINGS: Insert PG");
                var localizedRating = AGE_RATINGS[ratings.ageRating] || ratings.ageRating;
                pgElement.removeClass('hide').text(localizedRating);
            }
        }
        
        var imdbElement = $('.rate--imdb.hide', render);
        if (imdbElement.length) {
            var imdbRating; // Объявляем переменную один раз в начале
            if (ratings.imdb && !isNaN(ratings.imdb)) {
                console.log("MAXSM-RATINGS: Insert IMDB from OMDB");
                imdbRating = parseFloat(ratings.imdb).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
            else if (ratings.imdb_kp && !isNaN(ratings.imdb_kp)) {
                console.log("MAXSM-RATINGS: Insert IMDB from KP");
                imdbRating = parseFloat(ratings.imdb_kp).toFixed(1);
                imdbElement.removeClass('hide').find('> div').eq(0).text(imdbRating);
            }
        }
        
        var kpElement = $('.rate--kp.hide', render);
        if (kpElement.length && ratings.kp && !isNaN(ratings.kp)) {
            console.log("MAXSM-RATINGS: Insert KP");
            var kpRating = parseFloat(ratings.kp).toFixed(1);
            kpElement.removeClass('hide').find('> div').eq(0).text(kpRating);
        }
    }
    
    // Вспомогательные функции
    function extractRating(ratings, source) {
        if (!ratings || !Array.isArray(ratings)) return null;
        
        for (var i = 0; i < ratings.length; i++) {
            if (ratings[i].Source === source) {
                try {
                    return source === 'Rotten Tomatoes' 
                        ? parseFloat(ratings[i].Value.replace('%', '')) 
                        : parseFloat(ratings[i].Value.split('/')[0]);
                } catch(e) {
                    console.error('Ошибка при парсинге рейтинга:', e);
                    return null;
                }
            }
        }
        return null;
    }
    
    function insertRatings(rtRating, mcRating, oscars, awards) {
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;
    
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
    
        var lastRate = $('.full-start__rate:last', rateLine);
        
        var showRT = localStorage.getItem('maxsm_ratings_plugin_tomatoes')  === 'true';
        var showMC = localStorage.getItem('maxsm_ratings_plugin_metacritic')  === 'true';
        var showAwards = localStorage.getItem('maxsm_ratings_plugin_awards') === 'true';
        var showOscar =  localStorage.getItem('maxsm_ratings_plugin_oscars')  === 'true';
        var showColors = localStorage.getItem('maxsm_ratings_plugin_colors')  === 'true';        
        // var showIcons = localStorage.getItem('maxsm_ratings_plugin_icons')  === 'true';
        
        var elemLabel;
        
        if (showRT && rtRating && !isNaN(rtRating) && !$('.rate--rt', rateLine).length) {
            console.log("MAXSM-RATINGS: Insert Tomatoes");
            var rtElement = $(
                '<div class="full-start__rate rate--rt">' +
                    '<div>' + rtRating + '</div>' +
                    '<div class="source--name">Tomatoes</div>' +
                '</div>'
            );
            
            if (lastRate.length) {
                rtElement.insertAfter(lastRate);
            } else {
                rateLine.prepend(rtElement);
            }
        }
    
        if (showMC && mcRating && !isNaN(mcRating) && !$('.rate--mc', rateLine).length) {
            console.log("MAXSM-RATINGS: Insert Metacritic");
            var insertAfter = $('.rate--rt', rateLine).length ? $('.rate--rt', rateLine) : lastRate;
            var mcElement = $(
                '<div class="full-start__rate rate--mc">' +
                    '<div>' + mcRating + '</div>' +
                    '<div class="source--name">Metacritic</div>' +
                '</div>'
            );
            
            if (insertAfter.length) {
                mcElement.insertAfter(insertAfter);
            } else {
                rateLine.prepend(mcElement);
            }
        }

        if (showAwards && awards && !isNaN(awards) && awards > 0 && !$('.rate--awards', rateLine).length) {
            console.log("MAXSM-RATINGS: Insert Awards");
            var awardsElement = $(
                '<div class="full-start__rate rate--awards rate--gold">' +
                    '<div>' + awards + '</div>' +
                    '<div class="source--name">' + Lampa.Lang.translate("maxsm_ratings_plugin_awards") + '</div>' +
                '</div>'
            );
            if (!showColors) { 
                awardsElement.removeClass('rate--gold'); 
            }
            rateLine.prepend(awardsElement); // Просто вставляем в начало
        }
    
        if (showOscar && oscars && !isNaN(oscars) && oscars > 0 && !$('.rate--oscars', rateLine).length) {
            console.log("MAXSM-RATINGS: Insert Oscars");
            var oscarsElement = $(
                '<div class="full-start__rate rate--oscars rate--gold">' +
                    '<div>' + oscars + '</div>' +
                    '<div class="source--name">' + Lampa.Lang.translate("maxsm_ratings_plugin_oscars") + '</div>' +
                '</div>'
            );
            if (!showColors) { 
                oscarsElement.removeClass('rate--gold'); 
            }
            rateLine.prepend(oscarsElement); // Просто вставляем в начало
        }
    }
    
    function calculateAverageRating() {
        console.log("MAXSM-RATINGS: Calculate avarage rating");
        var render = Lampa.Activity.active().activity.render();
        if (!render) return;
    
        var rateLine = $('.full-start-new__rate-line', render);
        if (!rateLine.length) return;
    
        var ratings = {
            imdb: parseFloat($('.rate--imdb div:first', rateLine).text()) || 0,
            tmdb: parseFloat($('.rate--tmdb div:first', rateLine).text()) || 0,
            kp: parseFloat($('.rate--kp div:first', rateLine).text()) || 0,
            mc: (parseFloat($('.rate--mc div:first', rateLine).text()) || 0) / 10,
            rt: (parseFloat($('.rate--rt div:first', rateLine).text()) || 0) / 10
        };
    
        var totalWeight = 0;
        var weightedSum = 0;
        var ratingsCount = 0;
        
        for (var key in ratings) {
            if (ratings.hasOwnProperty(key) && !isNaN(ratings[key]) && ratings[key] > 0) {
                weightedSum += ratings[key] * WEIGHTS[key];
                totalWeight += WEIGHTS[key];
                ratingsCount++;
            }
        }
    
        $('.rate--avg', rateLine).remove();
        
        // var simplemode = localStorage.getItem('maxsm_ratings_plugin_simplemode') === 'true';
        var mode = localStorage.getItem('maxsm_ratings_plugin_mode');
        console.log("MAXSM-RATINGS: Mode: " + mode);
        
        if (totalWeight > 0 && (ratingsCount > 1 || (parseInt(localStorage.getItem('maxsm_ratings_plugin_mode'), 10) === 1))) {
            var averageRating = ( weightedSum / totalWeight ).toFixed(1);
            var colorClass = getRatingClass(averageRating);
            
            console.log("MAXSM-RATINGS: Average rating: " + averageRating);
            
            var avgLabel = Lampa.Lang.translate("maxsm_ratings_plugin_avg");
            
            if (parseInt(localStorage.getItem('maxsm_ratings_plugin_mode'), 10) === 1) {
                avgLabel = Lampa.Lang.translate("maxsm_ratings_plugin_avg_simple");
                $('.full-start__rate', rateLine).not('.rate--oscars, .rate--avg, .rate--awards').hide();
            } 

            var avgElement = $(
                '<div class="full-start__rate rate--avg ' + colorClass + '">' +
                    '<div>' + averageRating + '</div>' +
                    '<div class="source--name">' + avgLabel + '</div>' +
                '</div>'
            );

            var showColors = localStorage.getItem('maxsm_ratings_plugin_colors')  === 'true';
            
            if (!showColors) { 
                avgElement.removeClass(colorClass); 
            }
            
            $('.full-start__rate:first', rateLine).before(avgElement);
        }
    }
        
    // Инициализация плагина
    function startPlugin() {
        console.log("MAXSM-RATINGS: initialized"); 
        window.maxsmRatingsPlugin = true;
        
        if (!localStorage.getItem('maxsm_ratings_plugin_oscars')) {
            localStorage.setItem('maxsm_ratings_plugin_oscars', 'true');
        }
        
        if (!localStorage.getItem('maxsm_ratings_plugin_awards')) {
            localStorage.setItem('maxsm_ratings_plugin_awards', 'true');
        }
        
        if (!localStorage.getItem('maxsm_ratings_plugin_metacritic')) {
            localStorage.setItem('maxsm_ratings_plugin_metacritic', 'true');
        }
        
        if (!localStorage.getItem('maxsm_ratings_plugin_tomatoes')) {
            localStorage.setItem('maxsm_ratings_plugin_tomatoes', 'true');
        }
        
        if (!localStorage.getItem('maxsm_ratings_plugin_colors')) {
            localStorage.setItem('maxsm_ratings_plugin_colors', 'true');
        }
    
        if (!localStorage.getItem('maxsm_ratings_plugin_mode')) {
            localStorage.setItem('maxsm_ratings_plugin_mode', '0');
        }
        
        Lampa.SettingsApi.addComponent({
            component: "maxsm_ratings_plugin",
            name: Lampa.Lang.translate("maxsm_ratings_plugin"),
            icon: star_svg
        });

        // Создание объекта для значений выбора режима
        var modeValue = {};
        modeValue[0] = Lampa.Lang.translate("maxsm_ratings_plugin_mode_normal");
        modeValue[1] = Lampa.Lang.translate("maxsm_ratings_plugin_simplemode");
        modeValue[2] = Lampa.Lang.translate("maxsm_ratings_plugin_mode_noavg");
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_mode",
                type: 'select',
                values: modeValue,
                default: 0
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_mode"),
                description: ''
            },
            onChange: function(value) {

            }
        });

        /*Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_simplemode",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_simplemode"),
                description: ''
            },
            onChange: function(value) {
            }
        });*/
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_oscars",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_oscars"),
                description: ''
            },
            onChange: function(value) {
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_awards",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_awards"),
                description: ''
            },
            onChange: function(value) {
            }
        });

        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_tomatoes",
                type: "trigger",
                default: true
            },
            field: {
                name: 'Tomatoes',
                description: ''
            },
            onChange: function(value) {
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_metacritic",
                type: "trigger",
                default: true
            },
            field: {
                name: 'Metacritic',
                description: ''
            },
            onChange: function(value) {
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_colors",
                type: "trigger",
                default: true
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_colors"),
                description: ''
            },
            onChange: function(value) {
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: "maxsm_ratings_plugin",
            param: {
                name: "maxsm_ratings_plugin_icons",
                type: "trigger",
                default: false
            },
            field: {
                name: Lampa.Lang.translate("maxsm_ratings_plugin_icons"),
                description: ''
            },
            onChange: function(value) {
            }
        });
        
        
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() {
                    fetchAdditionalRatings(e.data.movie);
                }, 500);
            }
        });
    }

    if (!window.maxsmRatingsPlugin) startPlugin();
})();
