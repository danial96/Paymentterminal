import subprocess, json

ids = ['IKIA1022', 'IKIA1020', 'IKIA1021', 'IKIA1028', 'IKIA1025']

script = f"""
const {{ PrismaClient }} = require('./lib/generated/prisma');
const p = new PrismaClient();
p.hRMEmployee.findMany({{
  where: {{ employeeId: {{ in: {json.dumps(ids)} }} }},
  select: {{ employeeId: true, firstName: true, lastName: true, shift: {{ select: {{ name: true, startTime: true }} }} }}
}}).then(r => {{ console.log(JSON.stringify(r)); p.$disconnect(); }});
"""

with open('_tmp_shift.mjs', 'w') as f:
    f.write(script)

result = subprocess.run(['node', '_tmp_shift.mjs'], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)

import os; os.remove('_tmp_shift.mjs')
