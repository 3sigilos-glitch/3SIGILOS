// Simulador de dados para ver o painel a mexer sem o carro por perto.
// Aproxima um C200 com caixa automatica de 5 relacoes (5G-Tronic).

const GEARS = [
  { max: 25, ratio: 78 },
  { max: 55, ratio: 46 },
  { max: 95, ratio: 30 },
  { max: 140, ratio: 22 },
  { max: 260, ratio: 17 },
];

const IDLE = 720;

export function createMockSource() {
  let t = 0;
  let speed = 0;
  let rpm = IDLE;
  let coolant = 19;
  let throttle = 0;
  let shiftDip = 0;
  let gear = 1;

  return function tick(dt) {
    t += dt;

    // Perfil de conducao: soma de senos com periodos primos, para nao se
    // notar o ciclo a repetir.
    const wave =
      0.5 +
      0.28 * Math.sin(t / 11.3) +
      0.14 * Math.sin(t / 4.7 + 1.1) +
      0.08 * Math.sin(t / 2.3 + 2.7);
    const target = Math.max(0, Math.min(1, wave)) * 135;

    const delta = target - speed;
    const accel = Math.max(-28, Math.min(9, delta * 1.2)); // km/h por segundo
    speed = Math.max(0, speed + accel * dt);

    const nextGear = GEARS.findIndex((g) => speed < g.max) + 1 || GEARS.length;
    if (nextGear !== gear) {
      // Pequena queda de rotacao na passagem de caixa.
      if (nextGear > gear) shiftDip = 420;
      gear = nextGear;
    }
    shiftDip = Math.max(0, shiftDip - 900 * dt);

    throttle += (Math.max(0, accel) * 9 + (speed > 1 ? 8 : 0) - throttle) * Math.min(1, dt * 3);
    throttle = Math.max(0, Math.min(100, throttle));

    const cruise = speed * GEARS[gear - 1].ratio;
    const targetRpm = Math.max(IDLE, cruise + throttle * 12) - shiftDip;
    rpm += (targetRpm - rpm) * Math.min(1, dt * 4);
    rpm = Math.max(600, Math.min(6600, rpm + (Math.random() - 0.5) * 40));

    // Aquecimento do motor ate ao patamar do termostato, com a oscilacao tipica.
    const plateau = 88 + Math.sin(t / 19) * 3;
    coolant += (plateau - coolant) * Math.min(1, dt * (coolant < 80 ? 0.035 : 0.012));

    return {
      rpm: Math.round(rpm),
      speed: Math.round(speed),
      coolant: Math.round(coolant),
      throttle: Math.round(throttle),
      load: Math.round(Math.min(100, throttle * 0.8 + 18)),
      intake: Math.round(22 + throttle * 0.15),
      voltage: Number((14.1 + Math.sin(t / 7) * 0.18).toFixed(1)),
      gear,
    };
  };
}
