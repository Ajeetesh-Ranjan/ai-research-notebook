import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import type { Application } from 'express';

let app: Application;
let authToken: string;
let projectId: string;
let documentId: string;
let annotationId: string;
let conversationId: string;
let exportId: string;
let nodeId: string;
let edgeId: string;

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'password123';

/**
 * Integration tests for CiteMind API.
 */
describe('CiteMind API Integration Tests', () => {
  beforeAll(async () => {
    app = createApp();

    // Clean up any existing test data
    await prisma.annotation.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.documentChunk.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.documentPage.deleteMany({ where: {} }).catch(() => {});
    await prisma.document.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.knowledgeGraphEdge.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.knowledgeGraphNode.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.note.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.export.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.aIMessage.deleteMany({ where: {} }).catch(() => {});
    await prisma.aIConversation.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.projectCollaborator.deleteMany({ where: {} }).catch(() => {});
    await prisma.project.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.userSettings.deleteMany({ where: {} }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: 'default' } }).catch(() => {});
    await prisma.tenant.deleteMany({ where: { id: 'default' } }).catch(() => {});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ───────────────────────────────────────────
  // 1. Health Check
  // ───────────────────────────────────────────
  it('GET /health - should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  // ───────────────────────────────────────────
  // 2. Auth
  // ───────────────────────────────────────────
  it('POST /api/v1/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    authToken = res.body.token;
  });

  it('POST /api/v1/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/auth/login - should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    authToken = res.body.token;
  });

  it('POST /api/v1/auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('GET /api/v1/auth/me - should get current user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.settings).toBeDefined();
  });

  it('GET /api/v1/auth/me - should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  // ───────────────────────────────────────────
  // 3. Projects
  // ───────────────────────────────────────────
  it('POST /api/v1/projects - should create a project', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project');
    projectId = res.body.id;
  });

  it('GET /api/v1/projects - should list projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/projects/:id - should get a project', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(projectId);
    expect(res.body.documentCount).toBeDefined();
  });

  it('PATCH /api/v1/projects/:id - should update a project', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Project Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Project Name');
  });

  // ───────────────────────────────────────────
  // 4. Documents
  // ───────────────────────────────────────────
  it('POST /api/v1/projects/:id/documents - should upload a document (mock)', async () => {
    // Create a minimal PDF buffer (just for testing route)
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer\n<</Size 4/Root 1 0 R>>\nstartxref\n147\n%%EOF\n');

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', pdfBuffer, 'test.pdf');

    expect(res.status).toBe(201);
    expect(res.body.title).toBeDefined();
    documentId = res.body.id;
  });

  it('GET /api/v1/projects/:id/documents - should list documents', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/documents`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/projects/:id/documents/:docId - should get a document', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(documentId);
  });

  it('PATCH /api/v1/projects/:id/documents/:docId - should update document metadata', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Title', tags: ['test'] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  // ───────────────────────────────────────────
  // 5. Annotations
  // ───────────────────────────────────────────
  it('POST /api/v1/projects/:id/annotations - should create an annotation', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/annotations`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentId,
        projectId,
        type: 'highlight',
        pageNumber: 1,
        boundingBox: { x: 10, y: 20, width: 100, height: 15 },
        textContent: 'Important passage',
        noteContent: 'This is key',
      });

    expect(res.status).toBe(201);
    expect(res.body.textContent).toBe('Important passage');
    annotationId = res.body.id;
  });

  it('GET /api/v1/projects/:id/annotations - should list annotations', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/annotations`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ id: documentId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/v1/projects/:id/annotations/:id - should update an annotation', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}/annotations/${annotationId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: '#FF0000', noteContent: 'Updated note' });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe('#FF0000');
  });

  // ───────────────────────────────────────────
  // 6. AI Conversations
  // ───────────────────────────────────────────
  it('POST /api/v1/ai/conversations - should create a conversation', async () => {
    const res = await request(app)
      .post('/api/v1/ai/conversations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId,
        title: 'Test Conversation',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Conversation');
    conversationId = res.body.id;
  });

  it('POST /api/v1/ai/conversations/:id/messages - should send a message', async () => {
    const res = await request(app)
      .post(`/api/v1/ai/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'What is the summary of this document?' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBeDefined();
    expect(res.body.role).toBe('assistant');
  });

  it('GET /api/v1/ai/conversations/:id - should get conversation with messages', async () => {
    const res = await request(app)
      .get(`/api/v1/ai/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toBeDefined();
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  // ───────────────────────────────────────────
  // 7. Search
  // ───────────────────────────────────────────
  it('POST /api/v1/search - should perform hybrid search', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: 'Important',
        projectId,
        searchType: 'hybrid',
        topK: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('Important');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('GET /api/v1/search/suggestions - should return search suggestions', async () => {
    const res = await request(app)
      .get('/api/v1/search/suggestions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ q: 'Upd', projectId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });

  // ───────────────────────────────────────────
  // 8. Export
  // ───────────────────────────────────────────
  it('POST /api/v1/exports - should create an export', async () => {
    const res = await request(app)
      .post('/api/v1/exports')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId,
        name: 'Test Export',
        format: 'markdown',
        scope: 'project',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('completed');
    exportId = res.body.id;
  });

  it('GET /api/v1/exports/:id - should get export status', async () => {
    const res = await request(app)
      .get(`/api/v1/exports/${exportId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(exportId);
  });

  // ───────────────────────────────────────────
  // 9. Knowledge Graph
  // ───────────────────────────────────────────
  it('POST /api/v1/projects/:id/graph/nodes - should create a graph node', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/graph/nodes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nodeType: 'concept',
        label: 'Machine Learning',
        content: 'A field of AI',
        color: '#4CAF50',
      });

    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Machine Learning');
    nodeId = res.body.id;
  });

  it('GET /api/v1/projects/:id/graph/nodes - should list graph nodes', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/graph/nodes`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/projects/:id/graph/edges - should create a graph edge', async () => {
    // Create a second node for the edge
    const node2Res = await request(app)
      .post(`/api/v1/projects/${projectId}/graph/nodes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nodeType: 'concept',
        label: 'Deep Learning',
        content: 'Subset of ML',
      });

    const node2Id = node2Res.body.id;

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/graph/edges`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sourceId: nodeId,
        targetId: node2Id,
        edgeType: 'contains',
        label: 'is a subset of',
        strength: 0.9,
      });

    expect(res.status).toBe(201);
    expect(res.body.edgeType).toBe('contains');
    edgeId = res.body.id;
  });

  it('GET /api/v1/projects/:id/graph/edges - should list graph edges', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/graph/edges`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ───────────────────────────────────────────
  // 10. Board
  // ───────────────────────────────────────────
  it('GET /api/v1/projects/:id/board - should get board state', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}/board`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.projectId).toBe(projectId);
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect(Array.isArray(res.body.graphNodes)).toBe(true);
  });

  it('POST /api/v1/projects/:id/board - should save board state', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/board`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nodePositions: [{ id: nodeId, canvasPosition: { x: 100, y: 200 } }],
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Board state saved');
  });

  // ───────────────────────────────────────────
  // 11. Cleanup / Deletion
  // ───────────────────────────────────────────
  it('DELETE /api/v1/projects/:id/annotations/:id - should delete an annotation', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/annotations/${annotationId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  it('DELETE /api/v1/projects/:id/graph/edges/:id - should delete a graph edge', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/graph/edges/${edgeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  it('DELETE /api/v1/projects/:id/graph/nodes/:id - should delete a graph node', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/graph/nodes/${nodeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  it('DELETE /api/v1/projects/:id/documents/:id - should delete a document', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  it('DELETE /api/v1/projects/:id - should delete a project', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  // ───────────────────────────────────────────
  // 12. 404 Handler
  // ───────────────────────────────────────────
  it('GET /api/v1/nonexistent - should return 404', async () => {
    const res = await request(app)
      .get('/api/v1/nonexistent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
