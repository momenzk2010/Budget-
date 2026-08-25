// طبقة تخزين محلية بسيطة — بديل window.storage الخاص بـ Claude artifacts.
// تشتغل بالكامل offline لأنها تعتمد على localStorage بالمتصفح.
// لو بدك مزامنة بين أكتر من جهاز لاحقًا، هون بالضبط مكان ربط Firebase/Supabase:
// خلي get/set تتحقق من الشبكة، وتكتب/تقرأ من قاعدة سحابية بالإضافة للتخزين المحلي.

export const localStore = {
  async get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? { key, value } : null;
    } catch (e) {
      console.error("storage.get failed", e);
      return null;
    }
  },

  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return { key, value };
    } catch (e) {
      console.error("storage.set failed", e);
      return null;
    }
  },

  async delete(key) {
    try {
      window.localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (e) {
      console.error("storage.delete failed", e);
      return null;
    }
  },
};
