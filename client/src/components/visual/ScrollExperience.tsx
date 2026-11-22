import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, BriefcaseBusiness, MapPin, Users, Wrench } from 'lucide-react';
import { RibbonStage } from './RibbonStage';

const scenes = [
  {
    eyebrow: 'A better way to get started',
    title: <>Good work should<br /><span>move you forward.</span></>,
    description: 'A local-first experience that brings useful opportunities closer, without making the search feel complicated.',
    points: ['Explore before signing in', 'See clear work details', 'Choose what fits your day'],
    tag: 'THE KAAMSETU WAY',
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: 'Skills meet local needs',
    title: <>The right people.<br /><span>Closer to the work.</span></>,
    description: 'Discover trades and skilled people in your area. A clearer path from a local need to a real connection.',
    points: ['Electricians, plumbers and more', 'Browse public skill profiles', 'Search by trade and locality'],
    tag: 'LOCAL SKILL NETWORK',
    icon: Wrench,
  },
  {
    eyebrow: 'Built around clear connections',
    title: <>Know the work.<br /><span>Then connect.</span></>,
    description: 'Keep the important details visible, communicate directly and make decisions with more confidence.',
    points: ['Transparent job information', 'Direct worker and employer connections', 'Progress and feedback in one place'],
    tag: 'CLEAR FROM THE START',
    icon: BadgeCheck,
  },
];

export const ScrollExperience: React.FC = () => {
  const [activeScene, setActiveScene] = useState(0);
  const sceneRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = Number((visible.target as HTMLElement).dataset.sceneIndex);
      if (Number.isFinite(index)) setActiveScene(index);
    }, { threshold: [0.25, 0.45, 0.65, 0.8], rootMargin: '-8% 0px -8% 0px' });

    sceneRefs.current.forEach((scene) => scene && observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ks-scroll-experience" aria-label="How KaamSetu connects local work">
      <div className="ks-scroll-backdrop" aria-hidden="true">
        <RibbonStage />
        <div className="ks-scroll-vignette" />
      </div>

      <div className="ks-scroll-scenes">
        {scenes.map((scene, index) => {
          const Icon = scene.icon;
          const isActive = activeScene === index;
          return (
            <section
              key={scene.tag}
              ref={(element) => { sceneRefs.current[index] = element; }}
              data-scene-index={index}
              data-active={isActive}
              className={`ks-scroll-scene ks-scroll-scene-${index + 1}`}
              aria-label={scene.eyebrow}
            >
              <div className="ks-scene-inner">
                <div className="ks-scene-copy">
                  <p className="ks-scene-eyebrow"><span />{scene.eyebrow}</p>
                  <h2>{scene.title}</h2>
                  <p className="ks-scene-description">{scene.description}</p>
                  <ul className="ks-scene-points">
                    {scene.points.map((point) => <li key={point}><span><Icon size={14} /></span>{point}</li>)}
                  </ul>
                  <div className="ks-scene-actions">
                    <Link to={index === 1 ? '/workers' : '/jobs'} className="ks-scene-primary">
                      {index === 1 ? 'Explore skilled people' : 'Explore local jobs'} <ArrowUpRight size={16} />
                    </Link>
                    <span className="ks-scene-index">0{index + 2} / 04</span>
                  </div>
                </div>

                <div className="ks-scene-visual" aria-hidden="true">
                  <div className="ks-scene-glass">
                    <div className="ks-scene-glass-top">
                      <span className="ks-scene-brand-mark"><Icon size={19} /></span>
                      <span className="ks-scene-status"><i /> {scene.tag}</span>
                    </div>
                    <div className="ks-scene-visual-title">{index === 0 ? 'Find your next opportunity' : index === 1 ? 'Local skills, in one place' : 'A clearer way to connect'}</div>
                    <div className="ks-scene-visual-subtitle">{index === 0 ? 'Start with what you need.' : index === 1 ? 'Discover the right trade.' : 'Keep the important details close.'}</div>
                    <div className="ks-scene-mini-list">
                      {(index === 0
                        ? [{ icon: MapPin, title: 'Nearby opportunities', detail: 'Search by area and trade' }, { icon: BriefcaseBusiness, title: 'Clear work details', detail: 'Understand the job first' }, { icon: Users, title: 'Direct connections', detail: 'Connect when you are ready' }]
                        : index === 1
                          ? [{ icon: Wrench, title: 'Skilled trades', detail: 'Find the right kind of work' }, { icon: MapPin, title: 'Local discovery', detail: 'Focus on your locality' }, { icon: Users, title: 'People profiles', detail: 'See skills and experience' }]
                          : [{ icon: BadgeCheck, title: 'Clear expectations', detail: 'Review work information' }, { icon: BriefcaseBusiness, title: 'Track progress', detail: 'Keep work steps visible' }, { icon: Users, title: 'Mutual feedback', detail: 'Build confidence over time' }]
                      ).map((item) => {
                        const ItemIcon = item.icon;
                        return <div className="ks-scene-mini-row" key={item.title}><span><ItemIcon size={15} /></span><div><b>{item.title}</b><small>{item.detail}</small></div><ArrowUpRight size={14} /></div>;
                      })}
                    </div>
                    <div className="ks-scene-glass-foot"><span><i /> KAAMSETU</span><span>GOOD WORK, CLOSER TO HOME</span></div>
                  </div>
                  <div className="ks-scene-orbit ks-scene-orbit-one" />
                  <div className="ks-scene-orbit ks-scene-orbit-two" />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};
