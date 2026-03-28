use spacetimedb::{reducer, table, Identity, ReducerContext, ScheduleAt, Table, Timestamp};
use std::time::Duration;

// ─── TABLES ──────────────────────────────────────────────────────────────────

#[table(name = player, public)]
pub struct Player {
    #[primary_key]
    pub identity: Identity,
    pub hp: i32,
    pub max_hp: i32,
    pub currency: i32,
    /// "build" | "combat" | "shop"
    pub phase: String,
    pub round: i32,
}

#[table(name = container_on_board, public)]
pub struct ContainerOnBoard {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub owner: Identity,
    pub container_type: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub capacity: i32,
    pub soil_type: String,
    pub affinity: String,
}

#[table(name = plant_in_container, public)]
pub struct PlantInContainer {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub owner: Identity,
    pub plant_type: String,
    pub container_id: u64,
    pub slot_index: i32,
    pub element: String,
    pub power: i32,
}

#[table(name = combat_state, public)]
pub struct CombatState {
    #[primary_key]
    pub owner: Identity,
    pub enemy_name: String,
    pub enemy_hp: i32,
    pub enemy_max_hp: i32,
    pub enemy_attack: i32,
    pub tick: i32,
    pub status: String, // "active" | "victory" | "defeat"
}

#[table(name = combat_log_entry, public)]
pub struct CombatLogEntry {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub owner: Identity,
    pub tick: i32,
    pub message: String,
    pub entry_type: String, // "player_attack" | "enemy_attack" | "effect" | "system"
}

#[table(name = shop_offer, public)]
pub struct ShopOffer {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub owner: Identity,
    pub item_category: String, // "plant" | "container" | "relic"
    pub item_type: String,
    pub cost: i32,
    pub purchased: bool,
}

#[table(name = combat_tick_schedule, scheduled(auto_combat_tick))]
pub struct CombatTickSchedule {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub owner: Identity,
    pub scheduled_at: ScheduleAt,
}

// ─── GAME DATA ────────────────────────────────────────────────────────────────

fn container_data(container_type: &str) -> (i32, i32, i32, i32, &'static str, &'static str) {
    // (width, height, capacity, base_cost, soil_type, affinity)
    match container_type {
        "ClayPot"         => (1, 1, 1, 10, "normal", "none"),
        "WoodenPlanter"   => (2, 1, 2, 20, "normal", "none"),
        "GardenBed"       => (3, 2, 6, 40, "normal", "none"),
        "StoneBasin"      => (2, 2, 2, 35, "damp", "fungus"),
        "DryThornBox"     => (2, 1, 2, 30, "dry", "thorn"),
        "RichSoilBed"     => (2, 2, 4, 45, "rich", "none"),
        "RuneCircle"      => (2, 2, 3, 60, "sacred", "spirit"),
        "LunarPlanter"    => (2, 1, 2, 55, "lunar", "moon"),
        "SunBed"          => (2, 2, 4, 65, "radiant", "sun"),
        "RotPit"          => (2, 2, 3, 50, "cursed", "rot"),
        "HangingRack"     => (1, 3, 3, 40, "normal", "none"),
        "AncientGroveBed" => (3, 3, 9, 120, "sacred", "none"),
        "SpiritShrine"    => (2, 2, 2, 90, "sacred", "spirit"),
        "CompostHeap"     => (2, 2, 4, 55, "cursed", "none"),
        "WorldTreeRoot"   => (3, 2, 5, 100, "rich", "none"),
        _                 => (1, 1, 1, 10, "normal", "none"),
    }
}

fn plant_data(plant_type: &str) -> (&'static str, i32) {
    // (element, base_power)
    match plant_type {
        "Moonleaf"    => ("moon", 8),
        "Thornvine"   => ("thorn", 12),
        "Glowcap"     => ("fungus", 10),
        "Sunblossom"  => ("sun", 9),
        "Rotroot"     => ("rot", 11),
        "SpiritFern"  => ("spirit", 14),
        "Bramble"     => ("thorn", 18),
        "Rotbriar"    => ("rot", 22),
        "Dreamcap"    => ("moon", 20),
        "GroveSpirit" => ("spirit", 28),
        "RadiantFlower" => ("sun", 24),
        _             => ("verdant", 8),
    }
}

fn enemy_for_round(round: i32) -> (String, i32, i32) {
    // (name, hp, attack)
    match round {
        1 => ("Rot Spore".to_string(), 40, 4),
        2 => ("Wild Vine".to_string(), 60, 6),
        3 => ("Corrupted Bloom".to_string(), 90, 8),
        4 => ("Briar Wraith".to_string(), 130, 10),
        5 => ("Rot Infestion".to_string(), 170, 13),
        _ => (
            format!("Ancient Horror (Rd {})", round),
            200 + round * 30,
            15 + round * 2,
        ),
    }
}

fn shop_pool_for_round(round: i32) -> Vec<(String, String, i32)> {
    // (category, type, cost)
    let mut items = vec![
        ("plant".to_string(), "Moonleaf".to_string(), 15),
        ("plant".to_string(), "Thornvine".to_string(), 15),
        ("plant".to_string(), "Glowcap".to_string(), 15),
        ("plant".to_string(), "Sunblossom".to_string(), 15),
        ("plant".to_string(), "Rotroot".to_string(), 15),
        ("plant".to_string(), "SpiritFern".to_string(), 20),
        ("container".to_string(), "ClayPot".to_string(), 10),
        ("container".to_string(), "WoodenPlanter".to_string(), 20),
        ("container".to_string(), "GardenBed".to_string(), 40),
    ];
    if round >= 2 {
        items.push(("plant".to_string(), "Bramble".to_string(), 30));
        items.push(("container".to_string(), "StoneBasin".to_string(), 35));
        items.push(("container".to_string(), "RuneCircle".to_string(), 60));
        items.push(("container".to_string(), "LunarPlanter".to_string(), 55));
    }
    if round >= 3 {
        items.push(("plant".to_string(), "Dreamcap".to_string(), 35));
        items.push(("plant".to_string(), "GroveSpirit".to_string(), 50));
        items.push(("container".to_string(), "SunBed".to_string(), 65));
        items.push(("container".to_string(), "RotPit".to_string(), 50));
    }
    items
}

// ─── REDUCERS ────────────────────────────────────────────────────────────────

#[reducer(init)]
pub fn init(_ctx: &ReducerContext) {}

#[reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    let identity = ctx.sender;
    if ctx.db.player().identity().find(&identity).is_none() {
        ctx.db.player().insert(Player {
            identity,
            hp: 100,
            max_hp: 100,
            currency: 60,
            phase: "build".to_string(),
            round: 1,
        });
        // Give starter containers
        ctx.db.container_on_board().insert(ContainerOnBoard {
            id: 0,
            owner: identity,
            container_type: "WoodenPlanter".to_string(),
            x: 1, y: 1, width: 2, height: 1, capacity: 2,
            soil_type: "normal".to_string(),
            affinity: "none".to_string(),
        });
        ctx.db.container_on_board().insert(ContainerOnBoard {
            id: 0,
            owner: identity,
            container_type: "ClayPot".to_string(),
            x: 4, y: 3, width: 1, height: 1, capacity: 1,
            soil_type: "normal".to_string(),
            affinity: "none".to_string(),
        });
    }
}

#[reducer]
pub fn place_container(ctx: &ReducerContext, container_type: String, x: i32, y: i32) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "build" {
        return Err("Can only place containers during build phase".to_string());
    }
    let (width, height, capacity, cost, soil, affinity) = container_data(&container_type);
    if player.currency < cost {
        return Err(format!("Not enough currency (need {}, have {})", cost, player.currency));
    }
    // Bounds check
    if x < 0 || y < 0 || x + width > 10 || y + height > 10 {
        return Err("Container out of bounds".to_string());
    }
    // Overlap check
    for existing in ctx.db.container_on_board().owner().filter(&identity) {
        let ex = existing.x; let ey = existing.y;
        let ew = existing.width; let eh = existing.height;
        if x < ex + ew && x + width > ex && y < ey + eh && y + height > ey {
            return Err("Overlaps existing container".to_string());
        }
    }
    ctx.db.container_on_board().insert(ContainerOnBoard {
        id: 0, owner: identity,
        container_type,
        x, y, width, height, capacity,
        soil_type: soil.to_string(),
        affinity: affinity.to_string(),
    });
    ctx.db.player().identity().update(Player { currency: player.currency - cost, ..player });
    Ok(())
}

#[reducer]
pub fn remove_container(ctx: &ReducerContext, container_id: u64) -> Result<(), String> {
    let identity = ctx.sender;
    let c = ctx.db.container_on_board().id().find(&container_id)
        .ok_or("Container not found")?;
    if c.owner != identity {
        return Err("Not your container".to_string());
    }
    // Remove all plants inside first
    for plant in ctx.db.plant_in_container().container_id().filter(&container_id) {
        ctx.db.plant_in_container().id().delete(&plant.id);
    }
    ctx.db.container_on_board().id().delete(&container_id);
    Ok(())
}

#[reducer]
pub fn place_plant(ctx: &ReducerContext, plant_type: String, container_id: u64, slot_index: i32) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "build" {
        return Err("Can only place plants during build phase".to_string());
    }
    let container = ctx.db.container_on_board().id().find(&container_id)
        .ok_or("Container not found")?;
    if container.owner != identity {
        return Err("Not your container".to_string());
    }
    if slot_index < 0 || slot_index >= container.capacity {
        return Err("Invalid slot".to_string());
    }
    // Slot must be empty
    for p in ctx.db.plant_in_container().container_id().filter(&container_id) {
        if p.slot_index == slot_index {
            return Err("Slot already occupied".to_string());
        }
    }
    let plant_cost = 15i32;
    if player.currency < plant_cost {
        return Err(format!("Not enough currency (need {})", plant_cost));
    }
    let (element, base_power) = plant_data(&plant_type);
    // Soil bonus
    let soil_bonus = match (container.soil_type.as_str(), element) {
        ("lunar", "moon") | ("radiant", "sun") | ("sacred", "spirit")
        | ("dry", "thorn") | ("cursed", "rot") | ("damp", "fungus") => 2,
        _ => 0,
    };
    ctx.db.plant_in_container().insert(PlantInContainer {
        id: 0, owner: identity,
        plant_type,
        container_id, slot_index,
        element: element.to_string(),
        power: base_power + soil_bonus,
    });
    ctx.db.player().identity().update(Player { currency: player.currency - plant_cost, ..player });
    Ok(())
}

#[reducer]
pub fn remove_plant(ctx: &ReducerContext, plant_id: u64) -> Result<(), String> {
    let identity = ctx.sender;
    let p = ctx.db.plant_in_container().id().find(&plant_id)
        .ok_or("Plant not found")?;
    if p.owner != identity {
        return Err("Not your plant".to_string());
    }
    ctx.db.plant_in_container().id().delete(&plant_id);
    Ok(())
}

#[reducer]
pub fn rotate_container(ctx: &ReducerContext, container_id: u64) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "build" {
        return Err("Can only rotate during build phase".to_string());
    }
    let c = ctx.db.container_on_board().id().find(&container_id)
        .ok_or("Container not found")?;
    if c.owner != identity {
        return Err("Not your container".to_string());
    }
    // Square containers don't need rotation
    if c.width == c.height {
        return Ok(());
    }
    let new_w = c.height;
    let new_h = c.width;
    // Bounds check after rotation
    if c.x + new_w > 6 || c.y + new_h > 6 {
        return Err("Rotated container would be out of bounds".to_string());
    }
    // Overlap check (exclude self)
    for existing in ctx.db.container_on_board().owner().filter(&identity) {
        if existing.id == container_id { continue; }
        if c.x < existing.x + existing.width && c.x + new_w > existing.x
            && c.y < existing.y + existing.height && c.y + new_h > existing.y {
            return Err("Rotated container would overlap".to_string());
        }
    }
    ctx.db.container_on_board().id().update(ContainerOnBoard {
        width: new_w, height: new_h, ..c
    });
    Ok(())
}

#[reducer]
pub fn start_combat(ctx: &ReducerContext) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "build" {
        return Err("Not in build phase".to_string());
    }
    let (enemy_name, enemy_hp, enemy_attack) = enemy_for_round(player.round);
    // Clear previous combat log
    for entry in ctx.db.combat_log_entry().owner().filter(&identity) {
        ctx.db.combat_log_entry().id().delete(&entry.id);
    }
    // Remove stale combat state
    if ctx.db.combat_state().owner().find(&identity).is_some() {
        ctx.db.combat_state().owner().delete(&identity);
    }
    ctx.db.combat_state().insert(CombatState {
        owner: identity,
        enemy_name: enemy_name.clone(),
        enemy_hp, enemy_max_hp: enemy_hp,
        enemy_attack, tick: 0,
        status: "active".to_string(),
    });
    ctx.db.player().identity().update(Player { phase: "combat".to_string(), ..player });
    ctx.db.combat_log_entry().insert(CombatLogEntry {
        id: 0, owner: identity, tick: 0,
        message: format!("A {} appears! HP: {}", enemy_name, enemy_hp),
        entry_type: "system".to_string(),
    });
    // Schedule first combat tick
    ctx.db.combat_tick_schedule().insert(CombatTickSchedule {
        id: 0, owner: identity,
        scheduled_at: ScheduleAt::Duration(Duration::from_millis(800)),
    });
    Ok(())
}

fn compute_player_damage(ctx: &ReducerContext, identity: Identity) -> (i32, String) {
    let plants: Vec<_> = ctx.db.plant_in_container().owner().filter(&identity).collect();
    if plants.is_empty() {
        return (2, "Your grove stirs... (no plants deal 2 dmg)".to_string());
    }
    let mut total = 0i32;
    let mut parts: Vec<String> = vec![];
    for plant in &plants {
        let mut dmg = plant.power;
        // Container full bonus
        let container = ctx.db.container_on_board().id().find(&plant.container_id);
        if let Some(c) = container {
            let count = ctx.db.plant_in_container().container_id().filter(&c.id).count();
            if count as i32 >= c.capacity && c.container_type == "GardenBed" {
                dmg = (dmg as f32 * 1.1) as i32;
            }
            // Affinity bonus
            if c.affinity == plant.element {
                dmg += 2;
            }
            // Special containers
            if c.container_type == "DryThornBox" && plant.element == "thorn" { dmg += 1; }
            if c.container_type == "StoneBasin" && plant.element == "fungus" { dmg = (dmg as f32 * 1.5) as i32; }
            if c.container_type == "RuneCircle" && plant.element == "spirit" { dmg += 4; }
        }
        parts.push(format!("{} ({})", plant.plant_type, dmg));
        total += dmg;
    }
    let msg = format!("Your grove attacks: {} → {} total damage", parts.join(", "), total);
    (total, msg)
}

#[reducer]
pub fn auto_combat_tick(ctx: &ReducerContext, _arg: CombatTickSchedule) -> Result<(), String> {
    let identity = _arg.owner;
    let combat = match ctx.db.combat_state().owner().find(&identity) {
        Some(c) => c,
        None => return Ok(()),
    };
    if combat.status != "active" {
        return Ok(());
    }
    let player = match ctx.db.player().identity().find(&identity) {
        Some(p) => p,
        None => return Ok(()),
    };
    let tick = combat.tick + 1;
    let (player_dmg, attack_msg) = compute_player_damage(ctx, identity);
    let new_enemy_hp = (combat.enemy_hp - player_dmg).max(0);
    ctx.db.combat_log_entry().insert(CombatLogEntry {
        id: 0, owner: identity, tick,
        message: attack_msg,
        entry_type: "player_attack".to_string(),
    });
    if new_enemy_hp <= 0 {
        // Victory
        ctx.db.combat_state().owner().update(CombatState {
            enemy_hp: 0, tick, status: "victory".to_string(), ..combat
        });
        ctx.db.combat_log_entry().insert(CombatLogEntry {
            id: 0, owner: identity, tick,
            message: format!("Victory! The {} has been defeated!", combat.enemy_name),
            entry_type: "system".to_string(),
        });
        let reward = 30 + player.round * 10;
        ctx.db.player().identity().update(Player {
            phase: "shop".to_string(),
            round: player.round + 1,
            currency: player.currency + reward,
            ..player
        });
        // Populate shop
        for offer in ctx.db.shop_offer().owner().filter(&identity) {
            ctx.db.shop_offer().id().delete(&offer.id);
        }
        let pool = shop_pool_for_round(player.round);
        // Pick 5 random-ish items (deterministic based on tick + round)
        let seed = (tick as usize + player.round as usize) % pool.len();
        let selected: Vec<_> = (0..5).map(|i| &pool[(seed + i * 3) % pool.len()]).collect();
        for item in selected {
            ctx.db.shop_offer().insert(ShopOffer {
                id: 0, owner: identity,
                item_category: item.0.clone(),
                item_type: item.1.clone(),
                cost: item.2,
                purchased: false,
            });
        }
        ctx.db.combat_log_entry().insert(CombatLogEntry {
            id: 0, owner: identity, tick,
            message: format!("You earned {} currency! Entering shop...", reward),
            entry_type: "system".to_string(),
        });
        return Ok(());
    }
    // Enemy attacks
    let new_player_hp = (player.hp - combat.enemy_attack).max(0);
    ctx.db.combat_log_entry().insert(CombatLogEntry {
        id: 0, owner: identity, tick,
        message: format!("{} strikes for {} damage! Grove Vitality: {}/{}",
            combat.enemy_name, combat.enemy_attack, new_player_hp, player.max_hp),
        entry_type: "enemy_attack".to_string(),
    });
    if new_player_hp <= 0 {
        ctx.db.combat_state().owner().update(CombatState {
            enemy_hp: new_enemy_hp, tick, status: "defeat".to_string(), ..combat
        });
        ctx.db.combat_log_entry().insert(CombatLogEntry {
            id: 0, owner: identity, tick,
            message: "Your grove has fallen... The corruption wins.".to_string(),
            entry_type: "system".to_string(),
        });
        ctx.db.player().identity().update(Player { hp: 0, phase: "build".to_string(), ..player });
        return Ok(());
    }
    ctx.db.combat_state().owner().update(CombatState {
        enemy_hp: new_enemy_hp, tick, ..combat
    });
    ctx.db.player().identity().update(Player { hp: new_player_hp, ..player });
    // Schedule next tick
    ctx.db.combat_tick_schedule().insert(CombatTickSchedule {
        id: 0, owner: identity,
        scheduled_at: ScheduleAt::Duration(Duration::from_millis(1000)),
    });
    Ok(())
}

#[reducer]
pub fn buy_item(ctx: &ReducerContext, offer_id: u64) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "shop" {
        return Err("Not in shop phase".to_string());
    }
    let offer = ctx.db.shop_offer().id().find(&offer_id)
        .ok_or("Offer not found")?;
    if offer.owner != identity {
        return Err("Not your offer".to_string());
    }
    if offer.purchased {
        return Err("Already purchased".to_string());
    }
    if player.currency < offer.cost {
        return Err(format!("Need {} currency, have {}", offer.cost, player.currency));
    }
    ctx.db.shop_offer().id().update(ShopOffer { purchased: true, ..offer.clone() });
    ctx.db.player().identity().update(Player { currency: player.currency - offer.cost, ..player });
    Ok(())
}

#[reducer]
pub fn finish_shopping(ctx: &ReducerContext) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx.db.player().identity().find(&identity)
        .ok_or("Player not found")?;
    if player.phase != "shop" {
        return Err("Not in shop phase".to_string());
    }
    // Move purchased containers/plants to inventory (represented by placing them)
    // For now just transition to build
    ctx.db.player().identity().update(Player { phase: "build".to_string(), ..player });
    Ok(())
}

#[reducer]
pub fn reset_run(ctx: &ReducerContext) -> Result<(), String> {
    let identity = ctx.sender;
    // Clear everything and start fresh
    for c in ctx.db.container_on_board().owner().filter(&identity) {
        ctx.db.container_on_board().id().delete(&c.id);
    }
    for p in ctx.db.plant_in_container().owner().filter(&identity) {
        ctx.db.plant_in_container().id().delete(&p.id);
    }
    for e in ctx.db.combat_log_entry().owner().filter(&identity) {
        ctx.db.combat_log_entry().id().delete(&e.id);
    }
    if ctx.db.combat_state().owner().find(&identity).is_some() {
        ctx.db.combat_state().owner().delete(&identity);
    }
    for s in ctx.db.shop_offer().owner().filter(&identity) {
        ctx.db.shop_offer().id().delete(&s.id);
    }
    ctx.db.player().identity().update(Player {
        identity,
        hp: 100, max_hp: 100, currency: 60,
        phase: "build".to_string(),
        round: 1,
    });
    // Give starter containers
    ctx.db.container_on_board().insert(ContainerOnBoard {
        id: 0, owner: identity,
        container_type: "WoodenPlanter".to_string(),
        x: 1, y: 1, width: 2, height: 1, capacity: 2,
        soil_type: "normal".to_string(),
        affinity: "none".to_string(),
    });
    ctx.db.container_on_board().insert(ContainerOnBoard {
        id: 0, owner: identity,
        container_type: "ClayPot".to_string(),
        x: 4, y: 3, width: 1, height: 1, capacity: 1,
        soil_type: "normal".to_string(),
        affinity: "none".to_string(),
    });
    Ok(())
}
