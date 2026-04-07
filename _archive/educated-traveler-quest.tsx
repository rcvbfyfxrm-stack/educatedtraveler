import React, { useState } from 'react';
import { Award, Map, Users, Compass, Anchor, Wine, Mountain, Camera } from 'lucide-react';

const QuestMap = () => {
  const [selectedQuests, setSelectedQuests] = useState([]);
  const [activeTab, setActiveTab] = useState('map');

  const questCategories = {
    foundation: {
      name: 'Foundation Journeys',
      icon: Compass,
      color: 'from-blue-500 to-cyan-500',
      quests: [
        { id: 'bali-yoga-200', name: 'Bali Yoga Teacher 200hr', days: 21, price: 4500, cert: 'YA-200', xp: 200 },
        { id: 'thailand-dive-ow', name: 'Thailand Open Water Diver', days: 7, price: 3500, cert: 'PADI-OW', xp: 100 },
        { id: 'tuscany-wine', name: 'Tuscany Wine Fundamentals', days: 14, price: 6500, cert: 'WSET-2', xp: 150 }
      ]
    },
    mastery: {
      name: 'Mastery Quests',
      icon: Mountain,
      color: 'from-purple-500 to-pink-500',
      quests: [
        { id: 'bali-yoga-500', name: 'Bali Advanced Yoga 500hr', days: 60, price: 12000, cert: 'YA-500', xp: 500, requires: ['bali-yoga-200'] },
        { id: 'thailand-dive-dm', name: 'Thailand Divemaster Pro', days: 45, price: 9500, cert: 'PADI-DM', xp: 450, requires: ['thailand-dive-ow'] },
        { id: 'greece-rya-yacht', name: 'Greece RYA Yachtmaster', days: 30, price: 11000, cert: 'RYA-YM', xp: 400 }
      ]
    },
    saga: {
      name: 'Immersion Sagas',
      icon: Anchor,
      color: 'from-orange-500 to-red-500',
      quests: [
        { id: 'bali-wellness-saga', name: 'Bali Complete Wellness Saga', days: 180, price: 35000, cert: 'Master Practitioner', xp: 2000, requires: ['bali-yoga-500'] },
        { id: 'ocean-explorer-saga', name: 'Southeast Asia Ocean Explorer', days: 120, price: 28000, cert: 'Dive Instructor', xp: 1500, requires: ['thailand-dive-dm'] },
        { id: 'mediterranean-sailor', name: 'Mediterranean Sailing Odyssey', days: 90, price: 25000, cert: 'Professional Skipper', xp: 1200, requires: ['greece-rya-yacht'] }
      ]
    }
  };

  const totalXP = selectedQuests.reduce((sum, id) => {
    for (let cat of Object.values(questCategories)) {
      const quest = cat.quests.find(q => q.id === id);
      if (quest) return sum + quest.xp;
    }
    return sum;
  }, 0);

  const level = Math.floor(totalXP / 500) + 1;
  const nextLevelXP = level * 500;

  const toggleQuest = (questId) => {
    setSelectedQuests(prev => 
      prev.includes(questId) 
        ? prev.filter(id => id !== questId)
        : [...prev, questId]
    );
  };

  const canUnlock = (quest) => {
    if (!quest.requires) return true;
    return quest.requires.every(req => selectedQuests.includes(req));
  };

  const PersonaCard = () => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Persona</h2>
          <p className="text-slate-300">Level {level} Explorer</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-cyan-400">{totalXP} XP</div>
          <div className="text-sm text-slate-400">{nextLevelXP - totalXP} to Level {level + 1}</div>
        </div>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${((totalXP % 500) / 500) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Quests Completed</div>
          <div className="text-2xl font-bold">{selectedQuests.length}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Certifications</div>
          <div className="text-2xl font-bold">
            {selectedQuests.map(id => {
              for (let cat of Object.values(questCategories)) {
                const quest = cat.quests.find(q => q.id === id);
                if (quest) return quest.cert;
              }
            }).filter(Boolean).length}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-slate-400 mb-3">EARNED CERTIFICATIONS</h3>
        {selectedQuests.length === 0 ? (
          <p className="text-slate-500 text-sm">No certifications yet. Start your first quest!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedQuests.map(id => {
              for (let cat of Object.values(questCategories)) {
                const quest = cat.quests.find(q => q.id === id);
                if (quest) {
                  return (
                    <div key={id} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-3 py-1 text-xs font-medium text-yellow-200">
                      <Award className="inline w-3 h-3 mr-1" />
                      {quest.cert}
                    </div>
                  );
                }
              }
            })}
          </div>
        )}
      </div>
    </div>
  );

  const GoldenCircle = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          The Golden Circle
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Transform lives through prolonged source immersion—mastery lives where skills are born
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-500 rounded-xl p-6">
          <div className="text-5xl font-bold text-yellow-600 mb-2">WHY</div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">Transform Lives</h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            Through prolonged source immersion for mastery that lasts forever. Commit deeply, change completely.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-xl p-6">
          <div className="text-5xl font-bold text-blue-600 mb-2">HOW</div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">Unique Method</h3>
          <ul className="text-slate-700 text-sm space-y-2">
            <li>• Modular 21-day to 6-month stacking</li>
            <li>• Living-like-practitioners immersion</li>
            <li>• Unbreakable community bonds</li>
            <li>• Peak-performance optimization</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-500 rounded-xl p-6">
          <div className="text-5xl font-bold text-purple-600 mb-2">WHAT</div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">The Offering</h3>
          <ul className="text-slate-700 text-sm space-y-2">
            <li>• Foundation: 7-21 day journeys</li>
            <li>• Mastery: 30-60 day certifications</li>
            <li>• Sagas: 3-6 month transformations</li>
            <li>• Global credentials & lifelong network</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-center text-white">
        <p className="text-xl font-semibold mb-2">Your USP</p>
        <p className="text-lg">
          6-month source mastery with unbreakable bonds—<br />
          <span className="text-cyan-400 font-bold">only us scales immersion to transformation</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EducatedTraveler Quest Map
          </h1>
          <p className="text-slate-600">Build your mastery persona through immersive source journeys</p>
        </header>

        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Map className="inline w-5 h-5 mr-2" />
            Quest Map
          </button>
          <button
            onClick={() => setActiveTab('circle')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'circle'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Compass className="inline w-5 h-5 mr-2" />
            Golden Circle
          </button>
        </div>

        {activeTab === 'circle' ? (
          <GoldenCircle />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(questCategories).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <div key={key} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">{category.name}</h2>
                    </div>

                    <div className="space-y-3">
                      {category.quests.map(quest => {
                        const isUnlocked = canUnlock(quest);
                        const isSelected = selectedQuests.includes(quest.id);
                        
                        return (
                          <div
                            key={quest.id}
                            onClick={() => isUnlocked && toggleQuest(quest.id)}
                            className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-green-500 bg-green-50'
                                : isUnlocked
                                ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                                : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-800 mb-1">{quest.name}</h3>
                                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                  <span>{quest.days} days</span>
                                  <span>•</span>
                                  <span>${quest.price.toLocaleString()}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-600">{quest.xp} XP</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Award className="w-4 h-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-700">{quest.cert}</span>
                                </div>
                                {quest.requires && (
                                  <div className="mt-2 text-xs text-slate-500">
                                    Requires: {quest.requires.map(r => {
                                      for (let cat of Object.values(questCategories)) {
                                        const req = cat.quests.find(q => q.id === r);
                                        if (req) return req.name;
                                      }
                                    }).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                {isSelected ? (
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                                    ✓
                                  </div>
                                ) : isUnlocked ? (
                                  <div className="w-8 h-8 border-2 border-slate-300 rounded-full" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-slate-500">
                                    🔒
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <PersonaCard />

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-800">
                  <Users className="inline w-5 h-5 mr-2" />
                  Community Stats
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Pre-trip cohort</span>
                    <span className="font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alumni network</span>
                    <span className="font-semibold">Lifetime</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Small groups</span>
                    <span className="font-semibold">8-12 people</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-3">Ready to Begin?</h3>
                <p className="text-sm mb-4 text-cyan-50">
                  Live the source for months—emerge certified, connected, unstoppable.
                </p>
                <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-cyan-50 transition-all">
                  Start Your Journey
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestMap;