import bms
import matplotlib.pyplot as plt
from bms.signals.functions import Sinus
from bms.blocks.continuous import ODE
from bms.blocks.nonlinear import Saturation
from bms.core import Variable, DynamicSystem

saturation_limit = 2.0
total_time = 2
steps = 1000

sine_signal = Sinus(name='SineInput', amplitude=1.0, w=2*3.1415, phase=0, offset=0)

amplified = Variable('Amplified')
filtered = Variable('Filtered')
saturated = Variable('Saturated')

amp_block = ODE(sine_signal, amplified, [10.0], [1.0])

tau = 1 / (2 * 3.1415 * 0.5)
lpf_block = ODE(amplified, filtered, [1.0], [tau, 1.0])

sat_block = Saturation(filtered, saturated, -saturation_limit, saturation_limit)

system = DynamicSystem(total_time, steps, [amp_block, lpf_block, sat_block])
system.Simulate()

plt.plot(system.t, sine_signal.values, label='Original Input')
plt.plot(system.t, amplified.values, label=f'Amplified (×{10.0})')
plt.plot(system.t, filtered.values, label=f'Filtered (cutoff={0.5} Hz)')
plt.plot(system.t, saturated.values, label=f'Saturated (±{saturation_limit})')

plt.axhline(y=saturation_limit, color='gray', linestyle='--', linewidth=0.8)
plt.axhline(y=-saturation_limit, color='gray', linestyle='--', linewidth=0.8)

plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.title('Amplifier → Low-pass Filter → Saturation Chain')
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()