import Phaser from 'phaser'
import { getUnlockedIngredients, getUnlockedRecipes, sameRecipe } from '../game/recipes'
import type { Ingredient, Recipe } from '../game/recipes'
import { addDrinkIngredient, emptyDrinkState, preparationMatches } from '../game/drinkState'
import type { DrinkState } from '../game/drinkState'
import type { IngredientCategory } from '../game/ingredients'
import { ingredientDefinition } from '../game/ingredients'
import { applyShiftModeReward, calculateReward } from '../game/scoring'
import { weightedCustomerType, recipeFor } from '../game/customers'
import type { CustomerType } from '../game/customers'
import { loadProgress, recipeUnlockShift } from '../game/progress'
import type { PlayerProgress } from '../game/progress'
import { drawBarBackdrop, preloadBarVisuals } from '../ui/BarBackdrop'
import { CustomerCard } from '../ui/CustomerCard'
import { pickCustomerSprites, preloadCustomerSprites } from '../game/customerSprites'
import { DrinkBuilder } from '../ui/DrinkBuilder'
import { floatingText } from '../ui/FloatingText'
import { HudBar } from '../ui/HudBar'
import { IngredientButton } from '../ui/IngredientButton'
import { isMobileViewport } from '../ui/responsive'
import { RecipeOverlay } from '../ui/RecipeOverlay'
import { audioManager } from '../audio/AudioManager'
import { ResumeModal } from '../ui/ResumeModal'
import { IngredientTabs } from '../ui/IngredientTabs'
import { RECIPES } from '../game/recipes'
import { getShiftMode } from '../game/shiftModes'
import type { ShiftModeDefinition, ShiftModeId } from '../game/shiftModes'
import { ShiftModeBadge } from '../ui/ShiftModeBadge'
import { CYBER, CYBER_FONT } from '../ui/cyberTheme'
import { createCyberUiIcon } from '../ui/IconFactory'
import { installResponsiveLayout } from '../ui/LayoutManager'
import { FullscreenControl } from '../ui/FullscreenControl'

type Customer = {
  card: CustomerCard
  recipe: Recipe
  type: CustomerType
  patience: number
  patienceMax: number
  busy: boolean
}

const CUSTOMER_X = [235, 480, 725]
const CUSTOMER_Y = 184

export class GameScene extends Phaser.Scene {
  private money = 0
  private baseMoney = 0
  private reputation = 5
  private maxReputation = 5
  private timeLeft = 90
  private served = 0
  private missed = 0
  private errors = 0
  private customersLeft = 0
  private combo = 0
  private maxCombo = 0
  private progress!: PlayerProgress
  private customers: Customer[] = []
  private selectedCustomer = 0
  private drinkState: DrinkState = emptyDrinkState()
  private ingredientButtons = new Map<Ingredient, IngredientButton>()
  private ingredientNavObjects: Phaser.GameObjects.GameObject[] = []
  private availableRecipes: Recipe[] = []
  private availableIngredients: Ingredient[] = []
  private ingredientPage = 0
  private ingredientCategory: IngredientCategory = 'alcohol'
  private ingredientTabs?: IngredientTabs
  private hud?: HudBar
  private drinkBuilder?: DrinkBuilder
  private messageText?: Phaser.GameObjects.Text
  private messageBg?: Phaser.GameObjects.Rectangle
  private modeBadge?: ShiftModeBadge
  private recipeOverlay?: RecipeOverlay
  private resumeModal?: ResumeModal
  private shiftEvent?: Phaser.Time.TimerEvent
  private ended = false
  private overlayOpen = false
  private tabPaused = false
  private resumeModalOpen = false
  private insuranceUses = 0
  private inputLocked = false
  private cleanedUp = false
  private mode: ShiftModeDefinition = getShiftMode('normal')
  private readonly hiddenHandler = (): void => this.pauseForHiddenTab()
  private readonly visibleHandler = (): void => this.showResumeAfterHiddenTab()

  constructor() { super('GameScene') }

  preload(): void {
    preloadCustomerSprites(this)
    preloadBarVisuals(this)
  }

  create(data: { modeId?: ShiftModeId } = {}): void {
    this.clearComponentReferences()
    this.cleanedUp = false
    this.resetState(data.modeId)
    installResponsiveLayout(this)
    audioManager.setMood('game')
    audioManager.setMusicIntensity(this.mode.musicIntensity)
    audioManager.notify(this.mode.id === 'normal' ? 'shiftStarted' : `${this.mode.id}Start` as 'fridayRushStart' | 'vipNightStart' | 'shakerNightStart')
    drawBarBackdrop(this, { modeId: this.mode.id })
    this.hud = new HudBar(this)
    if (this.mode.id !== 'normal') this.modeBadge = new ShiftModeBadge(this, this.mode)
    this.createRecipeButton()
    new FullscreenControl(this, { x: 891, y: 20, compact: true })
    this.createCustomers()
    this.createIngredientButtons()
    this.drinkBuilder = new DrinkBuilder(
      this,
      () => this.clearDrink(),
      () => this.serveDrink(),
      () => this.shakeDrink(),
    )
    this.drinkBuilder.setShakerNightAccent(this.mode.id === 'shakerNight')
    this.createMessageToast()
    this.registerLifecycle()
    this.customers.forEach((customer) => this.assignOrder(customer))
    this.applyDevDrinkPreset()
    this.syncDrinkBuilder()
    this.refreshAll()
    if (this.mode.id !== 'normal') this.time.delayedCall(250, () => {
      if (this.isSceneUsable()) this.showMessage(this.mode.tutorialText, Phaser.Display.Color.IntegerToColor(this.mode.accentColor).rgba)
    })

    this.shiftEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.isSceneUsable()) return
        this.timeLeft -= 1
        this.refreshHud()
        if (this.timeLeft <= 0) this.finishShift(true)
      },
    })
  }

  update(_time: number, delta: number): void {
    if (this.ended || this.overlayOpen || this.tabPaused) return
    const patienceDrain = Math.max(0, 1 - this.progress.upgrades.quickHands * 0.1) * this.mode.patienceDrainMultiplier
    for (let index = 0; index < this.customers.length; index += 1) {
      const customer = this.customers[index]!
      if (customer.busy) continue
      customer.patience -= (delta / 1000) * patienceDrain
      const ratio = Phaser.Math.Clamp(customer.patience / customer.patienceMax, 0, 1)
      customer.card.setPatience(ratio)
      if (customer.patience <= 0) this.loseCustomer(index)
    }
  }

  private resetState(modeId: ShiftModeId | undefined): void {
    this.progress = loadProgress()
    this.mode = getShiftMode(modeId)
    this.money = 0
    this.baseMoney = 0
    this.maxReputation = 5 + this.progress.upgrades.cozyBar * 5 + this.progress.upgrades.reputationReserve
    this.reputation = this.maxReputation
    this.timeLeft = this.mode.durationSeconds
    this.served = 0
    this.missed = 0
    this.errors = 0
    this.customersLeft = 0
    this.combo = 0
    this.maxCombo = 0
    this.customers = []
    this.selectedCustomer = 0
    this.drinkState = emptyDrinkState()
    this.ingredientButtons.clear()
    this.ingredientNavObjects = []
    const unlocked = getUnlockedRecipes(recipeUnlockShift(this.progress))
    this.availableRecipes = unlocked.filter(this.mode.allowedRecipeFilter)
    if (this.availableRecipes.length === 0) {
      if (import.meta.env.DEV) console.warn(`[Bar Rush] Режим ${this.mode.id} не имеет доступных рецептов; запущена обычная смена.`)
      this.mode = getShiftMode('normal')
      this.timeLeft = this.mode.durationSeconds
      this.availableRecipes = unlocked
    }
    this.availableIngredients = getUnlockedIngredients(this.availableRecipes)
    this.ingredientPage = 0
    this.ingredientCategory = 'alcohol'
    this.insuranceUses = this.progress.upgrades.barInsurance
    this.inputLocked = false
    this.ended = false
    this.overlayOpen = false
    this.tabPaused = false
    this.resumeModalOpen = false
  }

  private createCustomers(): void {
    const sprites = pickCustomerSprites(CUSTOMER_X.length)
    CUSTOMER_X.forEach((x, index) => {
      const card = new CustomerCard(this, x, CUSTOMER_Y, sprites[index]!, () => this.selectCustomer(index))
      const customer: Customer = {
        card,
        recipe: this.availableRecipes[0]!,
        type: weightedCustomerType(this.mode.customerTypeWeights, this.progress.upgrades.advertising, this.progress.upgrades.neonSign),
        patience: 30,
        patienceMax: 30,
        busy: false,
      }
      this.customers.push(customer)
      card.setVip(this.mode.id === 'vipNight')
    })
  }

  private applyDevDrinkPreset(): void {
    if (!import.meta.env.DEV || this.progress.devDrinkPreset === 'none') return
    const shakeRecipe = RECIPES.find((recipe) => recipe.id === 'daiquiri')!
    this.customers[0]!.recipe = shakeRecipe
    this.customers[0]!.card.setOrder(shakeRecipe, this.customers[0]!.type)
    this.selectedCustomer = 0
    const correct = [...shakeRecipe.ingredients]
    this.drinkState = {
      ingredients: this.progress.devDrinkPreset === 'wrong' ? ['Водка', 'Кола'] : correct,
      phase: this.progress.devDrinkPreset === 'shaken' ? 'shaken' : 'filling',
      wasShaken: this.progress.devDrinkPreset === 'shaken',
    }
  }

  private createIngredientButtons(): void {
    this.ingredientButtons.forEach((button) => button.destroy())
    this.ingredientButtons.clear()
    this.ingredientNavObjects.forEach((object) => object.destroy())
    this.ingredientNavObjects = []
    this.ingredientTabs?.destroy()
    this.ingredientTabs = new IngredientTabs(this, this.availableIngredients, this.ingredientCategory, (category) => {
      this.ingredientCategory = category
      this.ingredientPage = 0
      this.createIngredientButtons()
    })
    const mobile = isMobileViewport()
    const portrait = mobile && window.innerHeight > window.innerWidth
    const pageSize = portrait ? 6 : mobile ? 6 : 8
    const categoryIngredients = this.availableIngredients.filter((ingredient) => ingredientDefinition(ingredient).category === this.ingredientCategory)
    const ingredients = categoryIngredients.slice(this.ingredientPage * pageSize, (this.ingredientPage + 1) * pageSize)
    ingredients.forEach((ingredient, index) => {
      const columns = portrait ? 3 : mobile ? 6 : 8
      const column = index % columns
      const row = Math.floor(index / columns)
      const rowCount = Math.min(columns, ingredients.length - row * columns)
      const spacing = portrait ? 300 : mobile ? 112 : 112
      const rowWidth = (rowCount - 1) * spacing
      const x = portrait
        ? 180 + column * spacing
        : 480 - rowWidth / 2 + column * spacing
      const y = portrait ? 349 + row * 42 : 360 + row * 47
      const width = portrait ? 276 : mobile ? 102 : 102
      const height = portrait ? 34 : mobile ? 45 : 52
      const button = new IngredientButton(this, x, y, width, height, ingredient, (picked, buttonX, buttonY) => {
        this.addIngredient(picked, buttonX, buttonY)
      })
      this.ingredientButtons.set(ingredient, button)
    })
    const pageCount = Math.ceil(categoryIngredients.length / pageSize)
    if (pageCount > 1) {
      const previous = this.createIngredientPageButton(32, 365, '‹', -1, pageCount)
      const next = this.createIngredientPageButton(928, 365, '›', 1, pageCount)
      const counter = this.add.text(480, 414, `${this.ingredientPage + 1}/${pageCount}`, {
        fontFamily: CYBER_FONT, fontSize: '11px', fontStyle: 'bold', color: '#72f1ff',
      }).setOrigin(0.5).setDepth(50)
      this.ingredientNavObjects.push(previous, next, counter)
    }
    this.refreshIngredientSelection()
  }

  private createIngredientPageButton(
    x: number, y: number, label: string, direction: number, pageCount: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y).setDepth(50)
    const bg = this.add.rectangle(0, 0, 36, 36, CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.65)
      .setInteractive({ useHandCursor: true })
    const text = this.add.text(0, -1, label, { fontFamily: CYBER_FONT, fontSize: '25px', color: '#eafcff' }).setOrigin(0.5)
    root.add([bg, text])
    bg.on('pointerdown', () => {
      this.ingredientPage = Phaser.Math.Wrap(this.ingredientPage + direction, 0, pageCount)
      this.createIngredientButtons()
    })
    return root
  }

  private createRecipeButton(): void {
    const button = this.add.rectangle(929, 20, 32, 30, CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.7)
      .setInteractive({ useHandCursor: true }).setDepth(40)
    createCyberUiIcon(this, 'recipe-book', 929, 20, 25).setDepth(41)
    button.on('pointerover', () => button.setFillStyle(CYBER.panelBright).setStrokeStyle(1, CYBER.magenta, 0.9))
    button.on('pointerout', () => button.setFillStyle(CYBER.panel).setStrokeStyle(1, CYBER.cyan, 0.7))
    button.on('pointerdown', () => this.openRecipeOverlay())
  }

  private openRecipeOverlay(): void {
    if (this.overlayOpen || this.ended) return
    this.overlayOpen = true
    this.syncShiftPause()
    this.recipeOverlay = new RecipeOverlay(this, this.availableRecipes, () => {
      if (!this.isSceneUsable()) return
      this.recipeOverlay = undefined
      this.overlayOpen = false
      this.syncShiftPause()
    })
  }

  private pauseForHiddenTab(): void {
    if (this.ended) return
    this.tabPaused = true
    this.tweens.pauseAll()
    this.syncShiftPause()
  }

  private showResumeAfterHiddenTab(): void {
    if (this.ended || !this.tabPaused || this.resumeModalOpen) return
    this.resumeModalOpen = true
    this.resumeModal = new ResumeModal(this, () => {
      if (!this.isSceneUsable()) return
      this.resumeModal = undefined
      this.resumeModalOpen = false
      this.tabPaused = false
      this.tweens.resumeAll()
      this.syncShiftPause()
    })
  }

  private syncShiftPause(): void {
    if (this.shiftEvent) this.shiftEvent.paused = this.overlayOpen || this.tabPaused
  }

  private createMessageToast(): void {
    this.messageBg = this.add.rectangle(480, 414, 370, 30, CYBER.panel, 0.95)
      .setStrokeStyle(1, CYBER.cyan, 0.48).setAlpha(0).setDepth(70)
    this.messageText = this.add.text(480, 414, '', {
      fontFamily: CYBER_FONT, fontSize: '12px', fontStyle: 'bold', color: '#72f1ff',
    }).setOrigin(0.5).setAlpha(0).setDepth(71)
  }

  private selectCustomer(index: number): void {
    if (!this.isSceneUsable()) return
    this.selectedCustomer = index
    this.refreshSelection()
    this.customers[index]!.card.pulseSelection()
    this.syncDrinkBuilder()
  }

  private addIngredient(ingredient: Ingredient, x: number, y: number): void {
    if (this.inputLocked || this.drinkState.phase === 'shaking') return
    if (this.drinkState.ingredients.length >= 6) {
      this.showMessage('Стакан уже полон', '#ff7883')
      this.drinkBuilder?.flashError()
      return
    }
    this.drinkState = addDrinkIngredient(this.drinkState, ingredient)
    audioManager.ingredientAdded(ingredient)
    this.drinkBuilder?.animateIngredientFrom(x, y, ingredient)
    this.syncDrinkBuilder()
    this.refreshIngredientSelection()
  }

  private clearDrink(): void {
    if (this.inputLocked || this.drinkState.phase === 'shaking') return
    this.drinkState = emptyDrinkState()
    this.syncDrinkBuilder()
    this.refreshIngredientSelection()
  }

  private shakeDrink(): void {
    if (this.inputLocked || this.drinkState.phase !== 'filling' || this.drinkState.ingredients.length === 0) return
    this.drinkState = { ...this.drinkState, phase: 'shaking', wasShaken: true }
    this.inputLocked = true
    this.syncDrinkBuilder()
    audioManager.notify('shakerStart')
    const duration = Math.max(450, 1000 * (1 - this.progress.upgrades.proShaker * 0.12))
    let hit = 0
    const loop = this.time.addEvent({ delay: 180, repeat: Math.max(2, Math.floor(duration / 180) - 1), callback: () => {
      if (!this.isSceneUsable()) return
      audioManager.notify(hit++ % 2 ? 'shakerIce' : 'shakerLoop')
    } })
    this.drinkBuilder?.animateShake(duration, () => {
      if (!this.isSceneUsable()) return
      loop.remove(false)
      this.drinkState = { ...this.drinkState, phase: 'shaken', wasShaken: true }
      this.inputLocked = false
      audioManager.notify('shakerComplete')
      this.syncDrinkBuilder()
    })
  }

  private serveDrink(): void {
    if (this.inputLocked || this.drinkState.ingredients.length === 0) return
    const customer = this.customers[this.selectedCustomer]!
    if (customer.busy) return

    const correct = sameRecipe(this.drinkState.ingredients, customer.recipe.ingredients)
      && preparationMatches(this.drinkState, customer.recipe.preparationMethod)
    if (correct) {
      this.drinkState = { ...this.drinkState, phase: 'served' }
      customer.busy = true
      customer.patience = customer.patienceMax
      this.combo += 1
      this.maxCombo = Math.max(this.maxCombo, this.combo)
      const baseReward = calculateReward(
        customer.recipe.reward,
        customer.type.rewardMultiplier,
        this.combo,
        this.progress.upgrades,
        customer.recipe.preparationMethod,
      )
      const reward = applyShiftModeReward(baseReward, this.mode.rewardMultiplier)
      this.baseMoney += baseReward
      this.money += reward
      this.served += 1
      floatingText(this, CUSTOMER_X[this.selectedCustomer]!, 146, `+$${reward}`, '#82efa1')
      this.animateMoneyToHud(CUSTOMER_X[this.selectedCustomer]!, 155)
      this.hud?.celebrateMoney()
      audioManager.orderSuccess(this.combo)
      this.successFlash(CUSTOMER_X[this.selectedCustomer]!, CUSTOMER_Y)
      if (this.combo >= 3) {
        this.comboBurst(368, 28)
        this.showMessage(`Комбо x${this.combo} · награда +25%!`, '#ffd56d')
      } else {
        this.showMessage('Идеально! Гость доволен', '#82efa1')
      }
      customer.card.celebrate(() => {
        if (!this.isSceneUsable()) return
        this.time.delayedCall(320 * this.mode.customerReplacementDelayMultiplier, () => {
          if (!this.isSceneUsable() || this.ended) return
          this.assignOrder(customer)
          customer.busy = false
        })
      })
    } else {
      this.reputation = Math.max(0, this.reputation - this.mode.reputationLossMultiplier)
      this.combo = 0
      this.missed += 1
      this.errors += 1
      audioManager.notify('orderFailed')
      floatingText(this, CUSTOMER_X[this.selectedCustomer]!, 150, `−${this.mode.reputationLossMultiplier} ⭐`, '#ff7380')
      customer.card.reactError()
      this.drinkBuilder?.flashError()
      if (!preparationMatches(this.drinkState, customer.recipe.preparationMethod)) audioManager.notify('wrongPreparation')
      this.showMessage('Не тот рецепт — попробуйте ещё', '#ff7883')
    }
    const delay = correct ? 0 : Math.max(80, 300 * (1 - this.progress.upgrades.quickCleanup * 0.2))
    this.inputLocked = delay > 0
    this.time.delayedCall(delay, () => {
      if (!this.isSceneUsable()) return
      this.inputLocked = false
      this.clearDrink()
      this.refreshAll()
      if (this.reputation <= 0) this.finishShift(false)
    })
  }

  private loseCustomer(index: number): void {
    const customer = this.customers[index]!
    if (customer.busy) return
    customer.busy = true
    if (this.insuranceUses > 0) this.insuranceUses -= 1
    else this.reputation = Math.max(0, this.reputation - this.mode.reputationLossMultiplier)
    this.combo = 0
    this.missed += 1
    this.customersLeft += 1
    audioManager.notify('customerLeft')
    floatingText(this, CUSTOMER_X[index]!, 158, 'УШЁЛ!', '#ff7380')
    customer.card.leave(CUSTOMER_X[index]!, () => {
      if (!this.isSceneUsable()) return
      this.time.delayedCall(320 * this.mode.customerReplacementDelayMultiplier, () => {
        if (!this.isSceneUsable() || this.ended) return
        this.assignOrder(customer)
        customer.busy = false
      })
    })
    this.refreshHud()
    if (this.reputation <= 0) this.time.delayedCall(100, () => {
      if (this.isSceneUsable()) this.finishShift(false)
    })
  }

  private assignOrder(customer: Customer): void {
    const otherSpriteKeys = this.customers
      .filter((item) => item !== customer)
      .map((item) => item.card.getSpriteKey())
    const nextSprite = pickCustomerSprites(1, otherSpriteKeys)[0]
    if (nextSprite) customer.card.setSprite(nextSprite)
    customer.type = weightedCustomerType(this.mode.customerTypeWeights, this.progress.upgrades.advertising, this.progress.upgrades.neonSign)
    customer.recipe = recipeFor(customer.type, this.availableRecipes, this.mode.recipeDifficultyWeights)
    customer.patienceMax = Phaser.Math.Between(25, 37) * customer.type.patienceMultiplier
    customer.patience = customer.patienceMax
    customer.card.setOrder(customer.recipe, customer.type)
    customer.card.setPatience(1)
    if (this.customers[this.selectedCustomer] === customer) this.syncDrinkBuilder()
  }

  private refreshAll(): void {
    this.refreshHud()
    this.refreshSelection()
    this.syncDrinkBuilder()
  }

  private refreshHud(): void {
    if (!this.isSceneUsable()) return
    this.hud?.update({
      money: this.money,
      combo: this.combo,
      reputation: this.reputation,
      maxReputation: this.maxReputation,
      timeLeft: this.timeLeft,
    })
  }

  private refreshSelection(): void {
    this.customers.forEach((customer, index) => customer.card.setSelected(index === this.selectedCustomer))
  }

  private refreshIngredientSelection(): void {
    this.ingredientButtons.forEach((button, ingredient) => {
      button.setSelected(this.drinkState.ingredients.includes(ingredient))
    })
  }

  private syncDrinkBuilder(): void {
    if (!this.isSceneUsable() || !this.drinkBuilder || !this.customers[this.selectedCustomer]) return
    this.drinkBuilder.setRecipe(this.customers[this.selectedCustomer]!.recipe)
    this.drinkBuilder.setState(this.drinkState)
  }

  private showMessage(message: string, color: string): void {
    if (!this.isSceneUsable() || !this.messageText?.active || !this.messageBg?.active) return
    this.messageText.setText(message).setColor(color).setAlpha(1)
    this.messageBg.setAlpha(0.94)
    this.tweens.killTweensOf([this.messageText, this.messageBg])
    this.tweens.add({
      targets: [this.messageText, this.messageBg],
      alpha: 0,
      delay: 1300,
      duration: 350,
    })
  }

  private animateMoneyToHud(x: number, y: number): void {
    for (let index = 0; index < 3; index += 1) {
      const coin = this.add.text(x + index * 12 - 12, y, '●', {
        fontSize: '20px', color: '#ffd65e', stroke: '#8a5620', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(100)
      this.tweens.add({
        targets: coin,
        x: 130,
        y: 28,
        alpha: 0.3,
        scale: 0.55,
        delay: index * 55,
        duration: 520,
        ease: 'Quad.easeIn',
        onComplete: () => coin.destroy(),
      })
    }
  }

  private comboBurst(x: number, y: number): void {
    for (let index = 0; index < 12; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const distance = Phaser.Math.Between(28, 64)
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), index % 2 ? 0xffd35e : 0xff765e)
        .setDepth(100)
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 480,
        onComplete: () => particle.destroy(),
      })
    }
  }

  private successFlash(x: number, y: number): void {
    const flash = this.add.circle(x, y - 20, 72, 0xffcf63, 0.24).setDepth(90)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.55,
      duration: 360,
      onComplete: () => flash.destroy(),
    })
  }

  private finishShift(reachedTimerEnd: boolean): void {
    if (this.ended) return
    this.ended = true
    this.shiftEvent?.remove(false)
    this.scene.start('ResultScene', {
      money: this.money,
      baseMoney: this.baseMoney,
      reputation: this.reputation,
      served: this.served,
      missed: this.missed,
      errors: this.errors,
      customersLeft: this.customersLeft,
      maxCombo: this.maxCombo,
      modeId: this.mode.id,
      reachedTimerEnd,
    })
  }

  private registerLifecycle(): void {
    window.addEventListener('bar-rush-hidden', this.hiddenHandler)
    window.addEventListener('bar-rush-visible', this.visibleHandler)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)
  }

  private isSceneUsable(): boolean {
    // During create() Phaser has not yet switched the status to RUNNING.
    // cleanup() is the authoritative barrier for callbacks from an older run.
    return !this.cleanedUp && this.sys.scene !== null
  }

  private cleanup(): void {
    if (this.cleanedUp) return
    this.cleanedUp = true
    window.removeEventListener('bar-rush-hidden', this.hiddenHandler)
    window.removeEventListener('bar-rush-visible', this.visibleHandler)
    this.shiftEvent?.remove(false)
    this.shiftEvent = undefined
    this.time.removeAllEvents()
    this.tweens.killAll()
    this.input.removeAllListeners()
    this.recipeOverlay?.destroy()
    this.resumeModal?.destroy()
    this.modeBadge?.destroy()
    this.ingredientTabs?.destroy()
    this.ingredientButtons.forEach((button) => button.destroy())
    this.customers.forEach((customer) => customer.card.destroy())
    this.drinkBuilder?.destroy()
    this.hud?.destroy()
    this.ingredientButtons.clear()
    this.ingredientNavObjects = []
    this.customers = []
    this.clearComponentReferences()
  }

  private clearComponentReferences(): void {
    this.hud = undefined
    this.drinkBuilder = undefined
    this.messageText = undefined
    this.messageBg = undefined
    this.modeBadge = undefined
    this.recipeOverlay = undefined
    this.resumeModal = undefined
    this.ingredientTabs = undefined
  }
}
