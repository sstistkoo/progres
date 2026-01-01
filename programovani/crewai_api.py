from flask import Flask, request, jsonify
from crewai import Agent, Task, Crew, Process
import os

app = Flask(__name__)

# Nastavení pro Ollama
os.environ["OPENAI_API_BASE"] = "http://localhost:11434/v1"
os.environ["OPENAI_MODEL_NAME"] = "qwen2.5-coder"
os.environ["OPENAI_API_KEY"] = "NA"

# Definice agentů (zkrácená verze pro demo)
architekt = Agent(
    role='UX/UI Architekt',
    goal='Navrhnout logickou strukturu a moderní design webové stránky.',
    backstory='Jsi expert na UX a vizuální styl.',
    verbose=True,
    allow_delegation=False
)
koder = Agent(
    role='Frontend Vývojář',
    goal='Převést plán do HTML a CSS kódu.',
    backstory='Mistr čistého kódu.',
    verbose=True,
    allow_delegation=False
)
tester = Agent(
    role='QA Revizor',
    goal='Zkontrolovat kód na chyby.',
    backstory='Hledáš chyby a nedostatky.',
    verbose=True,
    allow_delegation=False
)
dokumentarista = Agent(
    role='Technický Dokumentarista',
    goal='Vysvětlit, jak kód funguje.',
    backstory='Vysvětluješ jednoduše.',
    verbose=True,
    allow_delegation=False
)

@app.route('/crewai', methods=['POST'])
def crewai_chat():
    data = request.get_json()
    tema_webu = data.get('prompt', 'Moderní landing page pro kavárnu')
    # Definice úkolů
    ukol_architekt = Task(description=f'Navrhni strukturu pro webovou stránku na téma: {tema_webu}', agent=architekt, expected_output='Seznam sekcí a popis designu.')
    ukol_koder = Task(description='Napiš HTML a CSS kód podle návrhu architekta.', agent=koder, expected_output='Kompletní blok kódu v HTML/CSS.')
    ukol_tester = Task(description='Zkontroluj kód od vývojáře a navrhni opravy, pokud jsou nutné.', agent=tester, expected_output='Seznam oprav nebo potvrzení, že je kód v pořádku.')
    ukol_dokumentace = Task(description='Vytvoř stručný návod, jak tento kód použít a co která část dělá.', agent=dokumentarista, expected_output='Stručný manuál v češtině.')
    # Sestavení týmu
    posadka = Crew(
        agents=[architekt, koder, tester, dokumentarista],
        tasks=[ukol_architekt, ukol_koder, ukol_tester, ukol_dokumentace],
        process=Process.sequential
    )
    # Spuštění
    vysledek = posadka.kickoff(inputs={'tema_webu': tema_webu})
    return jsonify({'result': vysledek})

if __name__ == '__main__':
    app.run(port=5005, host='0.0.0.0', debug=True)
