import { Item, ItemCategory } from '../types/item';
import { NPC, NPCArchetype, DialogueOptionType } from '../types/npc';
import { GameEvent, EventEffectType, EventDuration } from '../types/event';
import { Ending, EndingType } from '../types/ending';

// 导入静态 JSON 数据
import itemsData from '../../data/items/items.json';
import eventsData from '../../data/events/events.json';
import endingsData from '../../data/endings/endings.json';

// 动态导入所有 NPC 数据
const npcModules = import.meta.glob('../../data/npcs/*.json', { eager: true });

/**
 * 解析道具数据
 */
function parseItem(data: any): Item {
  return {
    itemId: data.itemId,
    name: data.name,
    description: data.description,
    category: data.category as ItemCategory,
    price: data.price,
    effect: {
      satisfaction: data.effect?.satisfaction,
      trust: data.effect?.trust,
      appearanceBonus: data.effect?.appearanceBonus,
      unlockOptions: data.effect?.unlockOptions,
    },
    exposureRate: data.exposureRate,
    exposureDialogue: data.exposureDialogue,
    repeatable: data.repeatable,
  };
}

/**
 * 解析 NPC 数据
 */
function parseNPC(data: any): NPC {
  const dialogueTree: any = {};
  
  for (const [topicId, topic] of Object.entries(data.dialogueTree as Record<string, any>)) {
    dialogueTree[topicId] = {
      topicId: topic.topicId,
      question: topic.question,
      options: topic.options.map((opt: any) => ({
        type: opt.type as DialogueOptionType,
        text: opt.text,
        effect: opt.effect,
        itemRequired: opt.itemRequired,
        riskCheck: opt.riskCheck,
      })),
    };
  }

  return {
    npcId: data.npcId,
    name: data.name,
    description: data.description,
    archetype: data.archetype as NPCArchetype,
    stats: data.stats,
    satisfactionThreshold: data.satisfactionThreshold,
    dialogueTree,
    topicWeights: data.topicWeights,
  };
}

/**
 * 解析事件数据
 */
function parseEvent(data: any): GameEvent {
  return {
    eventId: data.eventId,
    name: data.name,
    description: data.description,
    triggerWeight: data.triggerWeight,
    effectType: data.effectType as EventEffectType,
    effectValue: data.effectValue,
    duration: data.duration as EventDuration,
    requiresChoice: data.requiresChoice,
    choices: data.choices,
    conditions: data.conditions,
  };
}

/**
 * 解析结局数据
 */
function parseEnding(data: any): Ending {
  return {
    endingId: data.endingId,
    type: data.type as EndingType,
    name: data.name,
    description: data.description,
    narrative: data.narrative,
    tags: data.tags,
    isHidden: data.isHidden,
    difficulty: data.difficulty,
  };
}

/**
 * 配置加载器类
 */
class ConfigLoader {
  private items: Item[] = [];
  private npcs: NPC[] = [];
  private events: GameEvent[] = [];
  private endings: Ending[] = [];
  private loaded = false;

  /**
   * 加载所有配置
   */
  load(): void {
    if (this.loaded) return;

    // 加载道具
    this.items = (itemsData as any[]).map(parseItem);

    // 加载 NPCs
    this.npcs = Object.values(npcModules).map((module: any) => parseNPC(module.default || module));

    // 加载事件
    this.events = (eventsData as any[]).map(parseEvent);

    // 加载结局
    this.endings = (endingsData as any[]).map(parseEnding);

    this.loaded = true;
    console.log(`[ConfigLoader] Loaded ${this.items.length} items, ${this.npcs.length} NPCs, ${this.events.length} events, ${this.endings.length} endings`);
  }

  /**
   * 获取所有道具
   */
  getItems(): Item[] {
    this.ensureLoaded();
    return this.items;
  }

  /**
   * 根据ID获取道具
   */
  getItemById(itemId: string): Item | undefined {
    this.ensureLoaded();
    return this.items.find((item) => item.itemId === itemId);
  }

  /**
   * 获取所有 NPC
   */
  getNPCs(): NPC[] {
    this.ensureLoaded();
    return this.npcs;
  }

  /**
   * 根据ID获取 NPC
   */
  getNPCById(npcId: string): NPC | undefined {
    this.ensureLoaded();
    return this.npcs.find((npc) => npc.npcId === npcId);
  }

  /**
   * 根据原型获取 NPC
   */
  getNPCsByArchetype(archetype: NPCArchetype): NPC[] {
    this.ensureLoaded();
    return this.npcs.filter((npc) => npc.archetype === archetype);
  }

  /**
   * 获取所有事件
   */
  getEvents(): GameEvent[] {
    this.ensureLoaded();
    return this.events;
  }

  /**
   * 根据ID获取事件
   */
  getEventById(eventId: string): GameEvent | undefined {
    this.ensureLoaded();
    return this.events.find((event) => event.eventId === eventId);
  }

  /**
   * 获取所有结局
   */
  getEndings(): Ending[] {
    this.ensureLoaded();
    return this.endings;
  }

  /**
   * 根据类型获取结局
   */
  getEndingByType(type: EndingType): Ending | undefined {
    this.ensureLoaded();
    return this.endings.find((ending) => ending.type === type);
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.load();
    }
  }
}

// 导出单例
export const configLoader = new ConfigLoader();

// 自动加载
configLoader.load();
