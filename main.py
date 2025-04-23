import matplotlib.pyplot as plt
from bms.signals.functions import Sinus
from bms.blocks.continuous import ODE
from bms.core import Variable, DynamicSystem


sine_signal = Sinus(name='SineWave', amplitude=1.0, w=2*3.1415, phase=0, offset=0)

output = Variable('output')
amplified = Variable('amplified')
block = ODE(sine_signal, output, [1], [1])

gain_blk = ODE(sine_signal, amplified,[5.0],[1])

model = DynamicSystem(2, 100, [block])

model_gain = DynamicSystem(2,100,[gain_blk])

model_gain.Simulate()

model.Simulate()
plt.plot(model_gain.t, sine_signal.values, label='Sine Input')
plt.plot(model_gain.t, output.values, label='Output')
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.title('Sinewave Simulation using BMSpy')
plt.legend()
plt.grid(True)
plt.show()