<template>
  <section class="hero">
    <div class="content">
      <h1>Eat better, live better!</h1>
      <p class="subtitle">Welcome to the Nutrition Planner App 🎉</p>
      <div class="home-cta">
        <RouterLink to="/guide" class="btn">Guide</RouterLink>
        <RouterLink to="/planner" class="btn">Planner</RouterLink>
      </div>
    </div>
  </section>

  <section class="about">
    <h2>Why Nutrition Matters</h2>
    <p>
      At <strong>Nutrition Planner</strong>, we believe that healthy eating should be simple,
      personalized, and enjoyable. Our mission is to provide you with smart daily meal
      recommendations tailored to your age, body, and lifestyle, so you can fuel your day with
      confidence and energy. 🌱
    </p>
    <p>
      Balanced nutrition is the foundation of good health — it helps boost your energy, supports
      your immune system, and even improves focus and mood. Whether your goal is to stay fit, build
      strength, or simply feel your best, a thoughtful meal plan is the key to long-term wellness.
      💪
    </p>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  min-height: 30vh;
  padding-top: 60px;
}

.content {
  max-width: 600px;
}

h1 {
  font-size: 2.5rem;
  color: #2a2a2a;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 24px;
}

.home-cta {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  background: #4caf7a;
  color: white;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #388e5a;
  transform: scale(1.05);
}

.about {
  max-width: 800px;
  margin: 40px auto;
  text-align: center;
  padding: 0 20px;
}

.about h2 {
  font-size: 1.8rem;
  margin-bottom: 16px;
  color: #2a2a2a;
}

.about p {
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  margin-bottom: 16px;
}
</style>
