import { type User, type InsertUser, type AiConfig, type InsertAiConfig, type UpdateAiConfig, type ContactLead, type InsertContactLead, contactLeads, type MerchantApplication, type InsertMerchantApplication, merchantApplications } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAiConfig(): Promise<AiConfig>;
  updateAiConfig(config: UpdateAiConfig): Promise<AiConfig>;
  createContactLead(lead: InsertContactLead): Promise<ContactLead>;
  getContactLeads(): Promise<ContactLead[]>;
  createMerchantApplication(app: InsertMerchantApplication): Promise<MerchantApplication>;
}

const DEFAULT_AI_CONFIG: AiConfig = {
  id: "default",
  enabled: false,
  model: "claude-sonnet-4-20250514",
  systemPrompt: "You are a helpful assistant for TechSavvy Limited. TechSavvy offers zero-fee payment processing with two pricing options: Option 1 is an outright purchase at $399 (best value — includes terminal, full setup, compliance signage kit, and free statement analysis). Option 2 is a 30-day risk-free trial with a free terminal loan; if the merchant keeps it, it auto-bills at $599 on day 31; if not, they return it and we cover return shipping (or local pickup in Honolulu). No monthly fees and no processing fees ever — customers pay a small surcharge instead. Merchants get 100% of their sale deposited into their account by the next business day. Minimum $5K-$10K monthly processing volume required to qualify. Only 4 trial spots available per month. Retail terminals sell for $800+, so both options are significantly discounted. For businesses that use TechSavvy's payment processor, we also offer: FREE custom websites for businesses that don't have an online presence, premium website packages (paid upgrade with advanced features), and custom software solutions to help run their business. These website and software services are exclusively available to TechSavvy payment processing customers. We also welcome high-risk merchants (CBD, vape, firearms, nutraceuticals, and more). Be friendly, professional, and concise.",
  welcomeMessage: "Hi! I'm TechSavvy's AI assistant. Ask me about our zero-fee payment processing, free websites for our merchants, premium web packages, or custom software solutions.",
  maxTokens: 1024,
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private aiConfig: AiConfig;

  constructor() {
    this.users = new Map();
    this.aiConfig = { ...DEFAULT_AI_CONFIG };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAiConfig(): Promise<AiConfig> {
    return this.aiConfig;
  }

  async updateAiConfig(config: UpdateAiConfig): Promise<AiConfig> {
    this.aiConfig = { ...this.aiConfig, ...config };
    return this.aiConfig;
  }

  async createContactLead(lead: InsertContactLead): Promise<ContactLead> {
    const [contactLead] = await db.insert(contactLeads).values(lead).returning();
    return contactLead;
  }

  async getContactLeads(): Promise<ContactLead[]> {
    return db.select().from(contactLeads).orderBy(desc(contactLeads.createdAt));
  }

  async createMerchantApplication(app: InsertMerchantApplication): Promise<MerchantApplication> {
    const [application] = await db.insert(merchantApplications).values(app).returning();
    return application;
  }
}

export const storage = new MemStorage();
