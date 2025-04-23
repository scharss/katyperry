// --- Variables Físicas y Constantes ---

// Declarar variables que serán inicializadas en setup()
let y;           // Altitud (metros)
let v;           // Velocidad vertical (m/s, positivo hacia arriba)
let a;           // Aceleración vertical (m/s^2)
let mass;        // Masa de la nave (kg)
let g;           // Aceleración debido a la gravedad (m/s^2)
let thrust;      // Empuje del motor (N) - Solo en fase Launch

let dragCoefficientRocket; // Coeficiente de resistencia para el cohete (Launch/CoastUp)
let dragCoefficientReentry; // Coeficiente de resistencia para la cápsula (Reentry/ZeroG)
let dragCoefficientParachute; // Coeficiente de resistencia para paracaídas (Parachute/Landed)

let liftCoefficientReentry; // Coeficiente de sustentación (conceptual en 2D)

let referenceAreaRocket; // Área de referencia para resistencia (m^2) - Cohete
let referenceAreaCapsule; // Área de referencia para resistencia (m^2) - Cápsula
let parachuteAreaMultiplier; // Multiplicador para el área efectiva con paracaídas

// Modelo de Densidad del Aire (Simple exponencial)
let rho0;        // Densidad del aire a nivel del mar (kg/m^3)
let scaleHeight; // Altura de escala atmosférica (metros)
let airDensity;  // Densidad del aire calculada en función de la altitud

// Variables conceptuales/visuales para descenso (no simuladas físicamente en 2D vertical)
let angleOfAttackReentryConcept = "N/A"; // Ángulo de ataque (conceptual)
let surfaceTemperatureConcept = "N/A"; // Representación conceptual de temperatura
let instantaneousTerminalVelocity = 0; // Velocidad terminal instantánea conceptual

// --- Variables de Simulación y Estado ---
let phase;       // Fase actual del vuelo ("Ready", "Launch", "CoastUp", "ZeroG", "Reentry", "Parachute", "Landed")
let timeInPhase; // Tiempo transcurrido en la fase actual (segundos simulados)
let totalTime;   // Tiempo total transcurrido (segundos simulados)
let maxAltitudeReached; // Altitud máxima alcanzada (metros)
let gForce;      // Fuerza G actual

// --- Variables de Visualización ---
let yPixelScale; // Factor para convertir metros a píxeles

// Altura del panel superior para datos
const DATA_PANEL_HEIGHT = 220; // Altura fija en píxeles

const MIN_DISPLAY_ALTITUDE_BUFFER = 100; // Altitud mínima extra visible debajo de 0m (para ver el suelo)
const MAX_DISPLAY_ALTITUDE_BUFFER_RATIO = 1.2; // Factor para mostrar un poco más que la altitud máxima
let maxDisplayAltitudeCurrent; // Altitud máxima actualmente mostrada en el canvas

let gForceBarHeight = 150; // Altura del indicador de G-force en píxeles
let gForceScale = 6; // Escala para la barra de G-force (maxG para la visualización). New Shepard picos tipicos ~3-5G.

let naveWidthPixels = 15; // Ancho visual de la nave
let naveHeightPixels = 30; // Altura visual de la nave

// Colores (Declarar, inicializar en setup)
let backgroundColor; // Un solo color de fondo (oscuro)
let groundColor; // Color del suelo
let parachuteLineColor; // Color de la línea de paracaídas

// Colores para el texto (SIEMPRE visibles y fijos - CLAROS)
let textColorPrimary; // Color para texto principal (Blanco)
let textColorSecondary; // Color para texto secundario/alternativo (Gris claro)

let warningColor; // Naranja para Kármán línea


// --- Factor de Velocidad de Simulación ---
// Queremos simular 12 minutos (720 segundos) en 1 minuto (60 segundos)
// Factor = Tiempo Simulado / Tiempo Real = 720 / 60 = 12
// Si aún dura un poco más, aumentamos ligeramente el factor.
const SIMULATION_SPEED_FACTOR = 13; // Ajustado de 12 a 13


// --- CONSTANTES DE VUELO (Hardcoded, se usan para inicializar variables en setup) ---
// Estas son las duraciones y altitudes *simuladas* típicas de New Shepard.
// La compresión del tiempo se logra con SIMULATION_SPEED_FACTOR.
const LAUNCH_THRUST_CONST = 500000; // N (500 kN)
const SHIP_MASS_CONST = 10000;      // kg (10 Toneladas)
const GRAVITY_CONST = 9.81;         // m/s^2

// --- Aerodynamic Constants ---
// Usamos un Cd que, combinado con el modelo de densidad, debería aproximarse a la realidad para el ascenso.
const ROCKET_CD_CONST = 0.28;
const REENTRY_CD_CONST = 1.5;
const PARACHUTE_CD_CONST = 2.2;
const REENTRY_CL_CONST = 0.1;
const REF_AREA_ROCKET_CONST = 10;
const REF_AREA_CAPSULE_CONST = 15;
const PARACHUTE_AREA_MULTIPLIER_CONST = 20;

// --- Atmospheric Model ---
const ATMOSPHERE_RHO0_CONST = 1.225;
// Aumentamos ligeramente la altura de escala para que la densidad caiga menos rápido
const ATMOSPHERE_SCALE_HEIGHT_CONST = 9500; // Antes 8500

// Mantenemos la lógica de densidad mínima pero ajustamos el nivel conceptual
const ATMOSPHERE_MIN_DENSITY_ALTITUDE_CONST = 150000; // Nivel conceptual para densidad mínima muy baja
const ATMOSPHERE_MIN_DENSITY_MULTIPLIER = 0.0001; // Multiplicador para la densidad mínima


// --- Flight Sequence Parameters (Duraciones Simuladas) ---
const LAUNCH_DURATION_CONST = 70; // ~70 segundos de motor simulados
const ZERO_G_DURATION_CONST = 120; // ~120 segundos (2 minutos) de ingravidez simulados

const PARACHUTE_DEPLOY_ALTITUDE_CONST = 5000; // ~5000 metros simulados

// --- Altitud Límite Explícita (Línea de Kármán) ---
const KARMAN_LINE_ALT_LIMIT = 100000; // 100 km


// --- Configuración Inicial ---
function setup() {
  createCanvas(600, 700); // Mantener el tamaño total del canvas
  frameRate(60); // Intentar 60 FPS para simulación más fluida

  // --- Inicializar variables físicas y constantes DENTRO de setup ---
  g = GRAVITY_CONST;
  mass = SHIP_MASS_CONST;
  thrust = LAUNCH_THRUST_CONST;

  dragCoefficientRocket = ROCKET_CD_CONST;
  dragCoefficientReentry = REENTRY_CD_CONST;
  dragCoefficientParachute = PARACHUTE_CD_CONST;
  liftCoefficientReentry = REENTRY_CL_CONST;

  referenceAreaRocket = REF_AREA_ROCKET_CONST;
  referenceAreaCapsule = REF_AREA_CAPSULE_CONST;
  parachuteAreaMultiplier = PARACHUTE_AREA_MULTIPLIER_CONST;

  rho0 = ATMOSPHERE_RHO0_CONST;
  scaleHeight = ATMOSPHERE_SCALE_HEIGHT_CONST;

  // --- Inicializar variables de color DENTRO de setup ---
  backgroundColor = color(10, 10, 70); // Un solo color de fondo oscuro (Espacio)
  groundColor = color(100, 80, 50); // Color del suelo
  parachuteLineColor = color(0, 255, 0); // Color de la línea de paracaídas

  // Colores para el texto (SIEMPRE visibles y fijos - CLAROS)
  textColorPrimary = color(255); // Blanco
  textColorSecondary = color(200); // Gris claro

  warningColor = color(255, 100, 0); // Naranja para Kármán línea


  // Inicializar variables de estado
  resetSimulation();

  // No se crean elementos DOM para controles.
}

// --- Bucle Principal de Dibujo y Simulación ---
function draw() {
  // Calculate real delta time in seconds
  let dt_real = deltaTime / 1000.0;
  // Calculate simulated delta time based on speed factor
  let dt_sim = dt_real * SIMULATION_SPEED_FACTOR;


  // --- Lógica de Simulación (Actualizar variables físicas) ---
  if (phase !== "Ready" && phase !== "Landed") {
      totalTime += dt_sim; // Use simulated time
      timeInPhase += dt_sim; // Use simulated time

      // Calcular densidad del aire en función de la altitud (modelo simple exponencial)
      let baseAirDensity = rho0 * exp(-y / scaleHeight);

      // Asegurarse de que haya una densidad mínima muy baja a altitudes muy altas,
      // pero no ponerla a cero abruptamente por debajo del nivel de 100km.
      // Usamos una altitud conceptual para la densidad mínima.
      let minAirDensityAtHighAlt = rho0 * exp(-ATMOSPHERE_MIN_DENSITY_ALTITUDE_CONST / scaleHeight) * ATMOSPHERE_MIN_DENSITY_MULTIPLIER;
      airDensity = max(baseAirDensity, minAirDensityAtHighAlt);
      // Evitar valores subnormales que causen problemas de punto flotante
      airDensity = max(airDensity, 1e-15); // Un valor muy pequeño pero no cero


      // Determinar Cd y Área de referencia según la fase (y si es cohete o cápsula)
      let currentCd;
      let currentArea;
      let currentCl = 0; // Cl es 0 por defecto, solo > 0 en Reentry conceptual

      switch (phase) {
          case "Launch":
          case "CoastUp":
              currentCd = dragCoefficientRocket;
              currentArea = referenceAreaRocket;
              break;
          case "ZeroG": // La separación de la cápsula ocurre antes o al principio de ZeroG
          case "Reentry":
              currentCd = dragCoefficientReentry;
              currentArea = referenceAreaCapsule;
              currentCl = liftCoefficientReentry; // Cl conceptual en Reentry
              break;
          case "Parachute":
              currentCd = dragCoefficientParachute; // Cd con paracaídas
              currentArea = referenceAreaCapsule * parachuteAreaMultiplier; // Área efectiva muy grande
              currentCl = 0; // No hay sustentación significativa con paracaídas
              break;
          default: // Should not happen, but fallback
              currentCd = dragCoefficientRocket;
              currentArea = referenceAreaRocket;
              currentCl = 0;
              break;
      }

      // Calcular fuerza de arrastre (siempre opuesta a la velocidad)
      // Formula: 0.5 * rho * v^2 * Cd * A
      // Usamos abs(v) para la magnitud y -sign(v) para la dirección en 2D vertical
      let dragMagnitude = 0.5 * airDensity * abs(v) * abs(v) * currentCd * currentArea;
      let dragForce = -sign(v) * dragMagnitude; // dragForce tiene signo opuesto a v

      // Calcular fuerza de sustentación conceptual (magnitud, no afecta física en 2D vertical)
      let liftMagnitude = 0.5 * airDensity * abs(v) * abs(v) * currentCl * currentArea;


      // Aplicar fuerzas según la fase
      let netForce = 0;
      switch (phase) {
        case "Launch":
          netForce = thrust + dragForce - mass * g; // Empuje (positivo) + Arrastre (negativo si v>0) - Gravedad (negativo)
          break;
        case "CoastUp":
        case "ZeroG": // En ZeroG y gran altitud, arrastre es muy bajo. Gravedad es la fuerza principal.
        case "Reentry": // Gravedad (negativo) + Arrastre (positivo si v<0)
        case "Parachute": // Gravedad (negative) + Arrastre Fuerte (positivo si v<0)
          netForce = dragForce - mass * g; // Arrastre (oposto a v) - Gravedad (siempre hacia abajo)
          break;
          // "Ready" y "Landed" tienen netForce = 0.
      }

      // Calcular aceleración neta
      a = netForce / mass;

      // --- Integración (Método de Euler simple) ---
      v += a * dt_sim; // Use simulated time
      y += v * dt_sim; // Use simulated time

      // --- RESTRICCIÓN MEJORADA: Limitar la altitud máxima a la Línea de Kármán ---
      // Aplicar la restricción si la altitud *intenta superar* el límite O *ya lo superó ligeramente* Y la nave no está activamente siendo propulsada hacia arriba.
      // Si la velocidad vertical se vuelve <= 0 (alcanzando apogeo) mientras está cerca o por encima del límite,
      // la forzamos a exactamente 100km y v=0.
      if (y >= KARMAN_LINE_ALT_LIMIT && phase !== "Launch") {
           // Caso 1: Alcanzó o superó el límite, y ya no sube activamente (v <= 0)
           if (v <= 0) {
               y = KARMAN_LINE_ALT_LIMIT; // Forzar altitud a 100 km
               v = 0; // Forzar velocidad vertical a cero
               // Forzar transición a ZeroG si aún no está allí
               if (phase === "CoastUp") {
                   phase = "ZeroG";
                   timeInPhase = 0; // Reiniciar tiempo en fase ZeroG
               }
           }
           // Caso 2: Superó el límite, pero todavía sube (v > 0).
           // La física normal (ralentización por gravedad/arrastre) sigue actuando.
           // La restricción de arriba se activará cuando v <= 0.

      } else if (y < KARMAN_LINE_ALT_LIMIT && phase === "CoastUp" && v <= 0 && y > 0) {
           // Caso 3: Alcanzó apogeo por debajo o exactamente en 100km
           // Transición normal de CoastUp a ZeroG.
           phase = "ZeroG";
           timeInPhase = 0;
           v = 0;
      }


      // Asegurar que la altitud no sea negativa (solo si no estamos ya aterrizados)
      if (y < 0 && phase !== "Landed") {
           y = 0;
           v = 0;
           a = 0;
           phase = "Landed";
           timeInPhase = 0;
           gForce = 1; // 1G en el suelo
      }


      // Actualizar altitud máxima
      // Asegurarse de que el máximo alcanzado no sea más de 100km si la restricción se aplicó
      if (y > maxAltitudeReached) {
          maxAltitudeReached = y;
      }
      // Si el máximo registrado superó Kármán antes de la restricción, ajustarlo.
      // Esto asegura que el dato mostrado al final sea 100km o menos.
      if (maxAltitudeReached > KARMAN_LINE_ALT_LIMIT && (v < 0 || phase === "Reentry" || phase === "Parachute" || phase === "Landed")) {
           maxAltitudeReached = KARMAN_LINE_ALT_LIMIT;
      }


      // --- Transiciones de Fase ---
      switch (phase) {
          case "Launch":
              if (timeInPhase >= LAUNCH_DURATION_CONST) { // Use simulated time in comparison
                  phase = "CoastUp";
                  timeInPhase = 0;
                  thrust = 0; // Apagar motor
              }
              // Protección: Si empieza a caer en launch (error param), transiciona
              // Check against simulated time
              if (v < 0 && timeInPhase > 5) { // Use simulated time
                   phase = "CoastUp";
                   timeInPhase = 0;
                   thrust = 0; // Apagar motor
              }
              break;
          case "CoastUp":
              // La transición a ZeroG ahora se maneja principalmente por la restricción de altitud/velocidad (Casos 1 y 3 arriba).
              break;
          case "ZeroG":
              if (timeInPhase >= ZERO_G_DURATION_CONST) { // Use simulated time in comparison
                  phase = "Reentry";
                  timeInPhase = 0;
              }
              break;
          case "Reentry":
              // Calcular variables conceptuales de reentrada
              // Ángulo de ataque conceptual: En 2D vertical, la nave apunta hacia arriba o abajo
              // El ángulo de trayectoria vs vertical es simplemente 0 o 180 grados.
              // Podríamos conceptualizar un ángulo de ataque si la nave rotara.
              // Aquí asumiremos un AoA ~0 para simplificar el perfil New Shepard.
              angleOfAttackReentryConcept = "~0° (vertical)"; // Placeholder conceptual

              // Temperatura superficial conceptual (basado en altitud y velocidad)
               let reentrySpeedThresholdLow = 100; // m/s
               let reentrySpeedThresholdHigh = 500; // m/s
               let reentryAltThresholdLow = 30000; // m
               let reentryAltThresholdHigh = 80000; // m

               if (y < reentryAltThresholdHigh && abs(v) > reentrySpeedThresholdLow) {
                   if (y < reentryAltThresholdLow && abs(v) > reentrySpeedThresholdHigh) {
                       surfaceTemperatureConcept = "Calentamiento Intenso";
                   } else if (y < reentryAltThresholdLow || abs(v) > reentrySpeedThresholdLow) {
                       surfaceTemperatureConcept = "Calentamiento Moderado";
                   } else {
                       surfaceTemperatureConcept = "Aumentando";
                   }
               } else {
                   surfaceTemperatureConcept = "Bajo/Normal";
               }


              if (y <= PARACHUTE_DEPLOY_ALTITUDE_CONST && v < 0) { // Use simulated altitude in comparison, If below parachute altitude and descending
                  phase = "Parachute";
                  timeInPhase = 0;
                  // Resetear conceptos de reentrada al salir de fase
                  angleOfAttackReentryConcept = "N/A";
                  surfaceTemperatureConcept = "Normal"; // Ya ha enfriado
              }

              // Aterrizaje de emergencia si cae por debajo de 0 antes de paracaídas
              if (y <= 0 && v < 0) {
                   y = 0; v = 0; a = 0;
                   phase = "Landed"; timeInPhase = 0; gForce = 1;
              }
              break;

          case "Parachute":
              // Calcular velocidad terminal instantánea (asumiendo arrastre = gravedad)
               let current_cd_parachute = dragCoefficientParachute;
               let current_area_parachute = referenceAreaCapsule * parachuteAreaMultiplier;
               // Evitar división por cero o negativo en la raíz cuadrada
               let denominator = (airDensity * current_cd_parachute * current_area_parachute);
               instantaneousTerminalVelocity = (denominator > 0.000001) ? sqrt(2 * mass * g / denominator) : 0;

              if (y <= 0) { // Aterrizado
                  y = 0; v = 0; a = 0;
                  phase = "Landed"; timeInPhase = 0; gForce = 1;
              }
              break;
      }

  } // Fin if phase != "Ready" && "Landed"

  // Asegurar que la altitud nunca sea negativa una vez aterrizado
  if (phase === "Landed" && y < 0) y = 0;
  // Asegurar altitud no negativa en Ready tampoco
  if (phase === "Ready" && y < 0) y = 0;


  // --- Calcular G-Force ---
  // G-force es la magnitud de las fuerzas NO gravitacionales, dividida por el peso (m*g)
  // En 2D vertical, las fuerzas no gravitacionales son Empuje y Arrastre.
  // La fórmula (a+g)/g es equivalente y más simple, donde a es la aceleración neta.
  // Si a=0, G=(0+g)/g = 1G (reposo o vel terminal).
  // Si a>0 (acel. neta hacia arriba), G>1G (sientes más pesado).
  // Si a<0 (acel. neta hacia abajo), G<1G (sientes más ligero, 0G en caída libre a = -g).
  gForce = (a + g) / g;
  // Asegurar que la G-force sea al menos 0 en la visualización de la barra
  // y un máximo para la escala de la barra
  let displayGForce = max(0, min(gForce, gForceScale));


  // --- Visualización ---

  // Establecer el fondo a un solo color
  background(backgroundColor); // Usar el color oscuro del espacio como fondo fijo

  // Calcular maxDisplayAltitudeCurrent para escalar la vista dinámicamente
  // Mostrar un poco más que el máximo alcanzado, pero al menos un rango mínimo
  // Si la altitud máxima es > 100km, asegurar que la escala muestre hasta 120km para que se vea la cima
  let targetMaxAlt = max(maxAltitudeReached, PARACHUTE_DEPLOY_ALTITUDE_CONST * 2, 10000, KARMAN_LINE_ALT_LIMIT * 1.2); // Asegurar que la escala cubra bien la línea de Kármán
  // Asegurar que la escala sea al menos 120km si se alcanza o supera 95km
  if (maxAltitudeReached >= KARMAN_LINE_ALT_LIMIT * 0.95 || y >= KARMAN_LINE_ALT_LIMIT * 0.95) { // Si la altitud actual o máxima alcanza cerca de 100km (95%)
      maxDisplayAltitudeCurrent = max(maxAltitudeReached * MAX_DISPLAY_ALTITUDE_BUFFER_RATIO, KARMAN_LINE_ALT_LIMIT * 1.2); // Mostrar al menos 120km
  } else {
       maxDisplayAltitudeCurrent = targetMaxAlt * MAX_DISPLAY_ALTITUDE_BUFFER_RATIO;
  }

  // Mapear altitud (0 a maxDisplayAltitudeCurrent) a píxeles en el ÁREA DE SIMULACIÓN
  // Mapea 0m a la base del área de simulación (height - MIN_DISPLAY_ALTITUDE_BUFFER)
  // Mapea maxDisplayAltitudeCurrent a la cima del área de simulación (DATA_PANEL_HEIGHT + MIN_DISPLAY_ALTITUDE_BUFFER)
  // Usamos MIN_DISPLAY_ALTITUDE_BUFFER tanto arriba como abajo para tener un pequeño margen visual
  let simAreaBottom = height - MIN_DISPLAY_ALTITUDE_BUFFER;
  let simAreaTop = DATA_PANEL_HEIGHT + MIN_DISPLAY_ALTITUDE_BUFFER;
  let yMapped = map(y, 0, maxDisplayAltitudeCurrent, simAreaBottom, simAreaTop);


  // Dibujar el suelo - En la base del área de simulación
  stroke(0);
  strokeWeight(2);
  // Línea del suelo visual
  line(0, simAreaBottom, width, simAreaBottom);
  fill(groundColor);
  noStroke();
  // Rellenar el área debajo de la línea del suelo
  rect(0, simAreaBottom, width, MIN_DISPLAY_ALTITUDE_BUFFER);


  // Dibujar la nave (rectángulo simple) - En el área de simulación
  fill(200); // Gris claro
  stroke(0); // Borde negro
  rectMode(CENTER);
  // Posición Y de la nave: mapeada y clampada para estar visible DENTRO del área de simulación
  let naveYPixel = constrain(yMapped, simAreaTop + naveHeightPixels/2, simAreaBottom - naveHeightPixels/2);
  rect(width / 2, naveYPixel, naveWidthPixels, naveHeightPixels); // Dibujar la nave centrada horizontalmente

  // Dibujar línea de la Línea de Kármán (100 km) - En el área de simulación
  const KARMAN_LINE_ALT = 100000; // metros
  if (KARMAN_LINE_ALT > 0 && KARMAN_LINE_ALT < maxDisplayAltitudeCurrent) {
      // Mapear la altitud de Kármán al área de simulación
      let karmanYPixel = map(KARMAN_LINE_ALT, 0, maxDisplayAltitudeCurrent, simAreaBottom, simAreaTop);
       // Solo dibujar la línea si está dentro de los límites verticales del área de simulación
       if (karmanYPixel >= simAreaTop && karmanYPixel <= simAreaBottom) {
            stroke(warningColor); // Naranja
            strokeWeight(1);
            line(0, karmanYPixel, width, karmanYPixel);
            fill(warningColor);
            noStroke();
            textAlign(LEFT, CENTER);
            textSize(12);

            // --- Ajuste de posición vertical del texto de Kármán para evitar traslape con panel de datos ---
            let karmanTextY = karmanYPixel - 5; // Posición por defecto un poco arriba de la línea

            // Si la línea de Kármán está demasiado cerca de la parte inferior del panel de datos (cima del área de simulación)
            // Usamos DATA_PANEL_HEIGHT + un margen para la comparación
            if (karmanYPixel < DATA_PANEL_HEIGHT + 30) { // Aumentado ligeramente el margen
                karmanTextY = karmanYPixel + 5 + textSize()/2; // Mueve el texto por debajo de la línea
            }

             // Asegurarse de que el texto no se salga por arriba del área de simulación
            karmanTextY = constrain(karmanTextY, simAreaTop + 10, simAreaBottom - 10); // Limitar dentro del área de simulación (con margen)

            // --- Colores de texto en área de simulación (Fijos y claros) ---
            fill(textColorPrimary); // Usar color fijo y claro para las etiquetas en área de simulación

            text(`Línea de Kármán: ${nf(KARMAN_LINE_ALT, 0, 0)}m (100 km)`, 5, karmanTextY);
       }
  }


  // Dibujar línea de altitud de paracaídas si es visible en la escala actual - En el área de simulación
  if (PARACHUTE_DEPLOY_ALTITUDE_CONST > 0 && PARACHUTE_DEPLOY_ALTITUDE_CONST < maxDisplayAltitudeCurrent) { // Usar constante
      // Mapear la altitud de paracaídas al área de simulación
      let parachuteYPixel = map(PARACHUTE_DEPLOY_ALTITUDE_CONST, 0, maxDisplayAltitudeCurrent, simAreaBottom, simAreaTop);

      // Solo dibujar la línea si está dentro de los límites verticales del área de simulación
      if (parachuteYPixel >= simAreaTop && parachuteYPixel <= simAreaBottom) {
           stroke(parachuteLineColor);
           strokeWeight(1);
           line(0, parachuteYPixel, width, parachuteYPixel);
           fill(parachuteLineColor);
           noStroke();
           textAlign(LEFT, CENTER);
           textSize(12);
           // --- Colores de texto en área de simulación (Fijos y claros) ---
            fill(textColorPrimary); // Usar color fijo y claro para las etiquetas en área de simulación
           text(`Alt. Paracaídas: ${nf(PARACHUTE_DEPLOY_ALTITUDE_CONST, 0, 0)}m`, 5, parachuteYPixel - 5);
      }
  }


  // --- Mostrar información de vuelo detallada por fase (EN PANEL DE DATOS) ---

  fill(textColorPrimary); // Usar color fijo para el panel de datos (Blanco)
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);

  let textX = 10;
  let textY = 10; // Posición Y relativa al inicio del canvas
  let textSpacing = 18; // Espacio vertical entre líneas de texto

  // Información General
  text(`Fase: ${phase}`, textX, textY); textY += textSpacing;
  text(`Altitud: ${nf(y, 0, 1)} m`, textX, textY); textY += textSpacing;
  text(`Velocidad: ${nf(v, 0, 1)} m/s`, textX, textY); textY += textSpacing;
  text(`Acel. Neta: ${nf(a, 0, 2)} m/s²`, textX, textY); textY += textSpacing;
  text(`Tiempo Total (Simulado): ${nf(totalTime, 0, 1)} s`, textX, textY); textY += textSpacing; // Aclarar que es tiempo simulado

  if (phase !== "Ready") {
      text(`Alt. Máx Alcanzada: ${nf(maxAltitudeReached, 0, 1)} m`, textX, textY); textY += textSpacing;
  }

  textY += textSpacing; // Espacio extra antes de variables por fase

  // Recalcular magnitudes de arrastre y sustentación para mostrar (ya se usaron en la física)
  let currentCdPhase;
  let currentAreaPhase;
  let currentClPhase = 0;
   if (phase === "Parachute") {
       currentCdPhase = dragCoefficientParachute;
       currentAreaPhase = referenceAreaCapsule * parachuteAreaMultiplier;
   } else if (phase === "Launch" || phase === "CoastUp") {
       currentCdPhase = dragCoefficientRocket;
       currentAreaPhase = referenceAreaRocket;
   } else { // ZeroG or Reentry
       currentCdPhase = dragCoefficientReentry;
       currentAreaPhase = referenceAreaCapsule;
       currentClPhase = liftCoefficientReentry; // Only conceptual Cl
   }

   let currentDragMagnitudeDisplay = 0.5 * airDensity * abs(v) * abs(v) * currentCdPhase * currentAreaPhase;
   let currentLiftMagnitudeDisplay = 0.5 * airDensity * abs(v) * abs(v) * currentClPhase * currentAreaPhase;


  // Variables específicas por fase
  fill(textColorSecondary); // Usar color secundario fijo para detalles de fase (Gris claro)

  switch (phase) {
      case "Ready":
          fill(textColorPrimary); // Mensaje principal en color primario fijo (Blanco)
          textAlign(CENTER, CENTER);
          textSize(20);
          // Posicionar el mensaje "Presiona ESPACIO" en el área de simulación
          text("Presiona ESPACIO para Iniciar Simulación", width/2, simAreaTop + (simAreaBottom - simAreaTop)/2); // Centro del área de simulación
          break;

      case "Launch":
          text(`-- Fase Lanzamiento --`, textX, textY); textY += textSpacing;
          text(`Empuje: ${nf(thrust, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Masa: ${nf(mass, 0, 0)} kg`, textX, textY); textY += textSpacing;
          text(`Cd Cohete: ${nf(dragCoefficientRocket, 0, 2)}`, textX, textY); textY += textSpacing;
          text(`Area Ref. Cohete: ${nf(referenceAreaRocket, 0, 1)} m²`, textX, textY); textY += textSpacing;
          text(`Densidad Aire: ${nf(airDensity, 0, 4)} kg/m³`, textX, textY); textY += textSpacing;
          text(`Fuerza Arrastre: ${nf(currentDragMagnitudeDisplay, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Gravedad (Peso): ${nf(mass*g, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Tiempo Motor Restante (Simulado): ${nf(max(0, LAUNCH_DURATION_CONST - timeInPhase), 0, 1)} s`, textX, textY); textY += textSpacing; // Usar constante y aclarar
          break;

      case "CoastUp":
          text(`-- Fase Ascenso Libre --`, textX, textY); textY += textSpacing;
          text(`Masa: ${nf(mass, 0, 0)} kg`, textX, textY); textY += textSpacing;
          text(`Cd Cohete: ${nf(dragCoefficientRocket, 0, 2)}`, textX, textY); textY += textSpacing;
          text(`Area Ref. Cohete: ${nf(referenceAreaRocket, 0, 1)} m²`, textX, textY); textY += textSpacing;
          text(`Densidad Aire: ${nf(airDensity, 0, 4)} kg/m³`, textX, textY); textY += textSpacing;
          text(`Fuerza Arrastre: ${nf(currentDragMagnitudeDisplay, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Gravedad (Peso): ${nf(mass*g, 0, 0)} N`, textX, textY); textY += textSpacing;
          break;

      case "ZeroG":
          text(`-- Fase Ingravidez (Apogeo) --`, textX, textY); textY += textSpacing;
          text(`Masa: ${nf(mass, 0, 0)} kg`, textX, textY); textY += textSpacing;
          text(`Cd Cápsula: ${nf(dragCoefficientReentry, 0, 2)}`, textX, textY); textY += textSpacing; // Se usa Cd de cápsula
          text(`Area Ref. Cápsula: ${nf(referenceAreaCapsule, 0, 1)} m²`, textX, textY); textY += textSpacing;
          text(`Densidad Aire: ${nf(airDensity, 0, 5)} kg/m³`, textX, textY); textY += textSpacing; // Muy baja
          text(`Fuerza Arrastre: ${nf(currentDragMagnitudeDisplay, 0, 2)} N`, textX, textY); textY += textSpacing; // Muy baja
          text(`Gravedad (Peso): ${nf(mass*g, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Tiempo Cero-G Restante (Simulado): ${nf(max(0, ZERO_G_DURATION_CONST - timeInPhase), 0, 1)} s`, textX, textY); textY += textSpacing; // Usar constante y aclarar
          break;

      case "Reentry":
          text(`-- Fase Reentrada Atmosférica --`, textX, textY); textY += textSpacing;
          text(`Masa: ${nf(mass, 0, 0)} kg`, textX, textY); textY += textSpacing;
          text(`Cd Cápsula: ${nf(dragCoefficientReentry, 0, 2)}`, textX, textY); textY += textSpacing;
          text(`Area Ref. Cápsula: ${nf(referenceAreaCapsule, 0, 1)} m²`, textX, textY); textY += textSpacing;
          text(`Densidad Aire: ${nf(airDensity, 0, 4)} kg/m³`, textX, textY); textY += textSpacing; // Aumentando
          text(`Fuerza Arrastre: ${nf(currentDragMagnitudeDisplay, 0, 0)} N`, textX, textY); textY += textSpacing; // Aumentando, positivo (hacia arriba)
          text(`Gravedad (Peso): ${nf(mass*g, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Alt. despliegue Paracaídas: ${nf(PARACHUTE_DEPLOY_ALTITUDE_CONST, 0, 0)} m`, textX, textY); textY += textSpacing; // Usar constante
          // Variables conceptuales de descenso (no simuladas físicamente en 2D)
          text(`Ángulo Ataque (concept.): ${angleOfAttackReentryConcept}`, textX, textY); textY += textSpacing;
          text(`Coef. Sustentación (concept.): ${nf(liftCoefficientReentry, 0, 2)}`, textX, textY); textY += textSpacing;
          text(`Sustentación (Magnitud Concept.): ${nf(currentLiftMagnitudeDisplay, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Temp. Superficie (concept.): ${surfaceTemperatureConcept}`, textX, textY); textY += textSpacing;
          break;

      case "Parachute":
          text(`-- Fase Descenso con Paracaídas --`, textX, textY); textY += textSpacing;
          text(`Masa: ${nf(mass, 0, 0)} kg`, textX, textY); textY += textSpacing;
          text(`Cd Paracaídas: ${nf(dragCoefficientParachute, 0, 2)}`, textX, textY); textY += textSpacing;
          text(`Area Efectiva: ${nf(referenceAreaCapsule * parachuteAreaMultiplier, 0, 1)} m²`, textX, textY); textY += textSpacing;
          text(`Densidad Aire: ${nf(airDensity, 0, 4)} kg/m³`, textX, textY); textY += textSpacing;
          text(`Fuerza Arrastre: ${nf(currentDragMagnitudeDisplay, 0, 0)} N (MUY ALTO)`, textX, textY); textY += textSpacing; // Muy grande, positivo (hacia arriba)
          text(`Gravedad (Peso): ${nf(mass*g, 0, 0)} N`, textX, textY); textY += textSpacing;
          text(`Velocidad Terminal (instantánea): ${nf(instantaneousTerminalVelocity, 0, 1)} m/s`, textX, textY); textY += textSpacing; // Velocidad terminal instantánea
          break;

      case "Landed":
          fill(0, 150, 0); // Verde para el mensaje principal (este color no cambia con altitud)
          textAlign(CENTER, CENTER);
          textSize(24);
          // Posicionar el mensaje "Aterrizaje Exitoso" en el área de simulación
          text("¡Aterrizaje Exitoso!", width/2, simAreaTop + (simAreaBottom - simAreaTop)/2 - 20); // Centro del área de simulación - ajustar Y
          fill(textColorPrimary); // Texto informativo en blanco (siempre visible sobre suelo)
          textSize(16);
          // Posicionar el texto informativo en el área de simulación
          text(`Altitud Máxima Alcanzada: ${nf(maxAltitudeReached, 0, 1)} m`, width/2, simAreaTop + (simAreaBottom - simAreaTop)/2 + 10); // Centro del área de simulación - ajustar Y
          text(`Tiempo Total de Vuelo (Simulado): ${nf(totalTime, 0, 1)} s`, width/2, simAreaTop + (simAreaBottom - simAreaTop)/2 + 30); // Centro del área de simulación - ajustar Y y aclarar

          break;
  }


  // --- Indicador de G-force (EN PANEL DE DATOS) ---
  let gForceDisplay = nf(gForce, 0, 2);
  fill(textColorPrimary); // Usar color principal fijo para la etiqueta "G-Force" en el panel de datos (Blanco)
  noStroke();
  textSize(14);
  textAlign(RIGHT, TOP);
  // Posicionar la etiqueta "G-Force" en el panel de datos
  text(`G-Force: ${gForceDisplay} G`, width - 10, 10);

  // Dibujar barra de G-force - En el panel de datos
  let gBarWidth = 30;
  let gBarX = width - gBarWidth - 10;
  let gBarY = 30; // Empezar un poco más abajo que la etiqueta "G-Force"
  let gBarBaseY = gBarY + gForceBarHeight; // Base de la barra (corresponde a 0G)

  // Barra de 0 a GForceScale Gs
  // Mapear la G-force (clampada) a la altura de la barra.
   let mappedG = map(displayGForce, 0, gForceScale, 0, gForceBarHeight);
   mappedG = constrain(mappedG, 0, gForceBarHeight); // Asegurar que está dentro del rango de la barra


  // Color de la barra (verde a amarillo a rojo)
  let gColor;
  if (gForce < 1.5) {
      gColor = color(0, 200, 0); // Verde (normal/bajo)
  } else if (gForce < 3) {
      gColor = lerpColor(color(0, 200, 0), color(255, 200, 0), map(gForce, 1.5, 3, 0, 1)); // Verde a amarillo
  } else {
      gColor = lerpColor(color(255, 200, 0), color(255, 0, 0), map(gForce, 3, gForceScale, 0, 1)); // Amarillo a rojo
      // Opcional: Asegurar que no excede el color rojo si GForceScale es menor que el pico real
      // gColor = constrain(gColor, color(0), color(255, 0, 0));
  }

  // Dibujar solo la barra de color - En el panel de datos
  fill(gColor); // Barra de G-force actual
  // La barra crece hacia arriba desde la base (0G)
  let barHeight = mappedG;
  rect(gBarX, gBarBaseY - barHeight, gBarWidth, barHeight);


  // Marcas en la barra (0G, 1G, 2G, etc.) - En el panel de datos
  stroke(150); // Marcas gris medio
  strokeWeight(1);
  fill(textColorPrimary); // Usar color principal fijo para las etiquetas de G en el panel de datos (Blanco)
  textAlign(RIGHT, CENTER);
  textSize(10);

  for (let i = 0; i <= gForceScale; i++) {
      let markerY = gBarBaseY - map(i, 0, gForceScale, 0, gForceBarHeight);
      line(gBarX, markerY, gBarX + gBarWidth, markerY);
      text(`${i}G`, gBarX - 5, markerY);
  }

   // Dibujar una línea separadora entre el panel de datos y el área de simulación
   stroke(0);
   strokeWeight(1);
   line(0, DATA_PANEL_HEIGHT, width, DATA_PANEL_HEIGHT);


}

// --- Función para Reiniciar la Simulación ---
function resetSimulation() {
  y = 0; // Altitud inicial (en el suelo)
  v = 0; // Velocidad inicial
  a = 0; // Aceleración inicial
  phase = "Ready";
  timeInPhase = 0;
  totalTime = 0;
  maxAltitudeReached = 0; // Reiniciar al inicio
  gForce = 1; // 1G en el suelo
  thrust = LAUNCH_THRUST_CONST; // Restablecer el empuje para el próximo lanzamiento usando la constante

  // Restablecer variables conceptuales de descenso
  angleOfAttackReentryConcept = "N/A";
  surfaceTemperatureConcept = "N/A";
  instantaneousTerminalVelocity = 0;
}

// --- Manejar Evento de Teclado (Espacio para Iniciar/Reiniciar) ---
function keyPressed() {
  if (key === ' ') {
    if (phase === "Ready") {
        // Iniciar simulación
        resetSimulation(); // Asegurarse de resetear antes de iniciar
        phase = "Launch";
        timeInPhase = 0; // Reiniciar tiempo en fase
        totalTime = 0; // Reiniciar tiempo total
        maxAltitudeReached = y; // Registrar la altitud inicial (0)
    } else if (phase === "Landed") {
        // Reiniciar simulación después de aterrizar
        resetSimulation();
    }
  }
}

// Función auxiliar para obtener el signo de un número
function sign(x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0; // Return 0 for 0
}