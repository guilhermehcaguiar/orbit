import { expect, test, type Page } from '@playwright/test';

const workspace = (page: Page) => page.locator('.ws-page');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
function civilDate(days = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

async function subject(page: Page, name: string) {
  await page.goto('/subjects');
  await button(page, 'Nova disciplina').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome da disciplina').fill(name);
  await dialog.getByRole('button', { name: 'Adicionar disciplina' }).click();
  await expect(workspace(page).getByRole('heading', { name })).toBeVisible();
}

async function entry(page: Page, kind: 'tarefa' | 'prova' | 'evento', title: string, discipline: string, date: string) {
  const routes = { tarefa: '/tasks', prova: '/exams', evento: '/calendar' };
  const labels = { tarefa: 'Prazo', prova: 'Data da prova', evento: 'Data do evento' };
  await page.goto(routes[kind]);
  await workspace(page).getByRole('button', { name: kind === 'evento' ? 'Novo evento' : `Nova ${kind}`, exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título').fill(title);
  await dialog.getByLabel(labels[kind]).fill(date);
  await dialog.getByLabel('Disciplina', { exact: true }).selectOption({ label: discipline });
  await dialog.getByRole('button', { name: `Adicionar ${kind}` }).click();
  await expect(workspace(page).getByText(title, { exact: true })).toBeVisible();
}

test('o serviço público entrega a web e encaminha o health para a API privada', async ({ request }) => {
  expect((await request.get('/')).ok()).toBe(true);
  const health = await request.get('/api/orbit/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({
    service: 'orbit-api', environment: 'production',
    ...(process.env.ORBIT_TEST_DATABASE_URL && { database: 'up' }),
  });
  expect((await request.get('/api/orbit/workspace')).status()).toBe(401);
  expect((await request.get('/api/v1/health')).status()).toBe(404);
});

test('o visitante preserva a rotina, o Pomodoro e as estatísticas ao recarregar', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-23T15:00:00Z') });
  const date = '2026-11-23';
  await subject(page, 'Cálculo');
  await entry(page, 'tarefa', 'Lista de exercícios', 'Cálculo', date);
  await entry(page, 'prova', 'Prova parcial', 'Cálculo', date);
  await entry(page, 'evento', 'Grupo de estudos', 'Cálculo', date);
  await workspace(page).getByRole('link', { name: 'Grupo de estudos', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Editar evento' }).getByLabel('Título')).toHaveValue('Grupo de estudos');
  await page.keyboard.press('Escape');
  await page.goto('/app');
  for (const title of ['Lista de exercícios', 'Prova parcial', 'Grupo de estudos']) {
    await expect(page.getByRole('region', { name: 'Agenda de hoje' }).getByRole('link', { name: title, exact: true })).toBeVisible();
  }
  await page.goto('/tasks');
  await button(page, 'Concluir Lista de exercícios').click();
  await page.reload();
  await expect(button(page, 'Reabrir Lista de exercícios')).toBeVisible();
  await page.goto('/settings');
  await page.getByLabel('Foco (minutos)').fill('1');
  await button(page, 'Salvar preferências').click();
  await page.goto('/pomodoro');
  await page.getByLabel('Vincular sessão').selectOption({ label: 'Cálculo' });
  await button(page, 'Iniciar foco').click();
  await expect(workspace(page).getByText('Em andamento', { exact: true })).toBeVisible();
  await page.clock.fastForward(62_000);
  await expect(workspace(page).getByRole('complementary', { name: 'Sessões recentes' }).getByText('1 min', { exact: true })).toBeVisible();
  await page.goto('/statistics');
  await expect(workspace(page).getByRole('heading', { name: 'Tempo de foco por disciplina' })).toBeVisible();
  await expect(workspace(page).getByText('Cálculo', { exact: true })).toBeVisible();
});

test('Hoje destaca atrasos e a busca abre o registro exato', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-11-23T15:00:00Z') });
  await subject(page, 'Programação');
  await entry(page, 'tarefa', 'Projeto atrasado', 'Programação', '2026-11-22');
  await entry(page, 'prova', 'Prova de algoritmos', 'Programação', '2026-11-23');
  await page.goto('/app');
  const overdue = page.getByRole('region', { name: 'Tarefas atrasadas' });
  await expect(overdue.getByRole('link', { name: 'Projeto atrasado' })).toBeVisible();
  await overdue.getByRole('button', { name: 'Concluir Projeto atrasado' }).click();
  await expect(overdue).toHaveCount(0);
  await button(page, 'Iniciar foco').click();
  await expect(page.getByText('Em andamento', { exact: true })).toBeVisible();
  const search = page.getByRole('searchbox');
  await search.fill('Prova de algoritmos');
  await page.getByRole('link', { name: /Prova de algoritmos Prova/ }).click();
  await expect(page.getByRole('dialog', { name: 'Editar prova' }).getByLabel('Título')).toHaveValue('Prova de algoritmos');
});

test('cadastra aulas recorrentes e permite ajustar e aceitar um plano semanal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-11-23T15:00:00Z') });
  await page.goto('/app');
  await page.getByRole('link', { name: 'Começar organização' }).click();
  await page.getByLabel('Nome da disciplina').fill('Física');
  await page.getByLabel('Nome da tarefa').fill('Revisão de ondas');
  await page.getByLabel('Prazo (opcional)').fill('2026-11-25');
  await button(page, 'Salvar primeiro compromisso').click();
  await page.getByRole('link', { name: 'Configurar semestre' }).click();
  await button(page, 'Novo semestre').click();
  await page.getByLabel('Nome do semestre').fill('2026.2');
  await page.getByLabel('Início do semestre').fill('2026-11-01');
  await page.getByLabel('Fim do semestre').fill('2026-12-15');
  await button(page, 'Salvar').click();
  await button(page, 'Novo horário').click();
  await page.getByLabel('Início da aula').fill('14:00');
  await page.getByLabel('Fim da aula').fill('15:00');
  await button(page, 'Salvar').click();
  await expect(workspace(page).getByText('Física', { exact: true })).toBeVisible();
  await page.goto('/ai');
  await expect(page.getByText('Adicione um horário livre para começar.')).toBeVisible();
  await button(page, 'Definir horário livre').click();
  await page.getByLabel('Horário inicial').fill('14:00');
  await page.getByLabel('Horário final').fill('17:00');
  await button(page, 'Salvar disponibilidade').click();
  await button(page, 'Gerar plano semanal').click();
  await expect(workspace(page).getByText(/15:00–15:25/)).toBeVisible();
  await button(page, 'Editar bloco de Revisão de ondas às 15:00').click();
  await page.getByLabel('Início do estudo').fill('14:30');
  await button(page, 'Salvar bloco').click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Escolha um horário livre');
  await page.getByLabel('Início do estudo').fill('16:00');
  await button(page, 'Salvar bloco').click();
  await button(page, 'Aceitar plano').click();
  await expect(workspace(page).getByRole('heading', { name: 'Plano aceito' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/calendar');
  await expect(workspace(page).getByText(/Estudo · 16:00–16:25/)).toBeVisible();
  await button(page, 'Semana').click();
  await expect(workspace(page).getByText(/Aula · 14:00–15:00/)).toBeVisible();
  await expect(workspace(page).getByText(/Estudo · 16:00–16:25/)).toBeVisible();
  await entry(page, 'tarefa', 'Relatório sem horário', 'Física', '2026-11-26');
  await page.goto('/ai');
  const remaining = page.getByRole('region', { name: 'Compromissos sem tempo suficiente' });
  await expect(remaining.getByRole('link', { name: 'Relatório sem horário' })).toBeVisible();
  await expect(remaining.getByText(/Faltam 25 min/)).toBeVisible();
});

test('sincroniza em outro navegador e isola os registros entre contas', async ({ page, browser, baseURL }) => {
  test.skip(!process.env.ORBIT_TEST_DATABASE_URL, 'Configure ORBIT_TEST_DATABASE_URL para testar contas com PostgreSQL.');
  const email = `estudante-${crypto.randomUUID()}@example.test`;
  const password = 'orbit-ci-synthetic-password';
  await subject(page, 'Disciplina do visitante');
  await page.goto('/cadastro');
  await page.getByLabel('Nome', { exact: true }).fill('Estudante A');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha').fill(password);
  await button(page, 'Criar conta').click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'Registros de visitante encontrados' })).toBeVisible();
  await page.goto('/settings');
  for (let attempt = 0; attempt < 2; attempt++) {
    await button(page, 'Importar registros do navegador').click();
    await expect(page.getByText('Registros importados.')).toBeVisible();
  }
  const session = (await page.context().cookies()).find(cookie => cookie.name === 'orbit_session');
  expect(session?.httpOnly).toBe(true);
  await subject(page, 'História');
  await expect(page.getByText('Registros sincronizados')).toBeVisible();
  await entry(page, 'tarefa', 'Leitura semanal', 'História', civilDate(1));
  await expect(page.getByText('Registros sincronizados')).toBeVisible();
  await entry(page, 'prova', 'Avaliação oral', 'História', civilDate(2));
  await expect(page.getByText('Registros sincronizados')).toBeVisible();

  const newBrowser = await browser.newContext({ baseURL });
  try {
    const linked = await newBrowser.newPage();
    await linked.goto('/login');
    await linked.getByLabel('E-mail').fill(email);
    await linked.getByLabel('Senha').fill(password);
    await button(linked, 'Entrar').click();
    await expect(linked).toHaveURL(/\/app$/);
    await linked.goto('/subjects');
    await expect(workspace(linked).getByRole('heading', { name: 'Disciplina do visitante' })).toHaveCount(1);
    await expect(workspace(linked).getByRole('heading', { name: 'História' })).toBeVisible();
    await linked.goto('/tasks');
    await expect(workspace(linked).getByText('Leitura semanal', { exact: true })).toBeVisible();
    await linked.goto('/exams');
    await expect(workspace(linked).getByText('Avaliação oral', { exact: true })).toBeVisible();
    await linked.goto('/settings');
    await button(linked, 'Sair da conta').click();
    await expect(linked).toHaveURL(/\/app$/);
    await linked.goto('/cadastro');
    await linked.getByLabel('Nome', { exact: true }).fill('Estudante B');
    await linked.getByLabel('E-mail').fill(`segundo-${email}`);
    await linked.getByLabel('Senha', { exact: true }).fill(password);
    await linked.getByLabel('Confirmar senha').fill(password);
    await button(linked, 'Criar conta').click();
    await expect(linked).toHaveURL(/\/onboarding$/);
    await linked.goto('/subjects');
    await expect(workspace(linked).getByText('Nenhuma disciplina cadastrada')).toBeVisible();
    await expect(workspace(linked).getByRole('heading', { name: 'História' })).toHaveCount(0);
  } finally {
    await newBrowser.close();
  }
});


test('recupera um rascunho em conflito após recarregar e preserva a edição de outra aba', async ({ page, context }) => {
  test.skip(!process.env.ORBIT_TEST_DATABASE_URL, 'Configure ORBIT_TEST_DATABASE_URL para testar contas com PostgreSQL.');
  await page.goto('/cadastro');
  await page.getByLabel('Nome', { exact: true }).fill('Estudante');
  await page.getByLabel('E-mail').fill(`rascunho-${crypto.randomUUID()}@example.test`);
  await page.getByLabel('Senha', { exact: true }).fill('orbit-ci-synthetic-password');
  await page.getByLabel('Confirmar senha').fill('orbit-ci-synthetic-password');
  await button(page, 'Criar conta').click();
  await expect(page).toHaveURL(/\/onboarding$/);
  const draftPage = await context.newPage();
  try {
    await draftPage.goto('/subjects');
    await button(draftPage, 'Nova disciplina').click();
    await draftPage.getByRole('dialog').getByLabel('Nome da disciplina').fill('Edição em rascunho');
    await subject(page, 'Edição da outra aba');
    await expect(page.getByText('Registros sincronizados')).toBeVisible();
    await draftPage.getByRole('dialog').getByRole('button', { name: 'Adicionar disciplina' }).click();
    await expect(button(draftPage, 'Recuperar alterações')).toBeVisible();
    await draftPage.reload();
    await expect(workspace(draftPage).getByRole('heading', { name: 'Edição em rascunho' })).toBeVisible();
    await button(draftPage, 'Recuperar alterações').click();
    await button(draftPage, 'Aplicar meu rascunho').click();
    await expect(draftPage.getByText('Registros sincronizados')).toBeVisible();
    await draftPage.reload();
    await expect(workspace(draftPage).getByRole('heading', { name: 'Edição da outra aba' })).toBeVisible();
    await expect(workspace(draftPage).getByRole('heading', { name: 'Edição em rascunho' })).toBeVisible();
    await expect(button(draftPage, 'Recuperar alterações')).toHaveCount(0);
  } finally {
    await draftPage.close();
  }
});
