import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './Contact.module.css';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    project: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className={styles.section}>
      <div ref={ref} className={styles.container}>
        <div className={styles.left}>
          <motion.span
            className={`pixel-font ${styles.label}`}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {'> '}HIRE US
          </motion.span>
          <motion.h2
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Let's build something
            <span className={styles.highlight}> great</span>
          </motion.h2>
          <motion.p
            className={styles.desc}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Got a project in mind? We're ready to talk. Tell us what you need and we'll get back to you within 24 hours.
          </motion.p>

          <motion.div
            className={styles.info}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className={styles.infoItem}>
              <span className={`pixel-font ${styles.infoIcon}`}>@</span>
              <span>info@kelnix.org</span>
            </div>
            <div className={styles.infoItem}>
              <span className={`pixel-font ${styles.infoIcon}`}>#</span>
              <span>Worldwide — Remote First</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className={styles.right}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {submitted ? (
            <motion.div
              className={styles.success}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span className={`pixel-font ${styles.successIcon}`}>✓</span>
              <h3 className={styles.successTitle}>Message Sent!</h3>
              <p className={styles.successDesc}>We'll get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={`pixel-font ${styles.fieldLabel}`}>NAME</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Your name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={`pixel-font ${styles.fieldLabel}`}>EMAIL</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={`pixel-font ${styles.fieldLabel}`}>PROJECT TYPE</label>
                <select
                  className={styles.input}
                  value={formState.project}
                  onChange={(e) => setFormState({ ...formState, project: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a project type</option>
                  <option value="web">Web Development</option>
                  <option value="mobile">Mobile App</option>
                  <option value="cloud">Cloud & DevOps</option>
                  <option value="ai">AI & Automation</option>
                  <option value="design">UI/UX Design</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={`pixel-font ${styles.fieldLabel}`}>MESSAGE</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Tell us about your project..."
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  required
                />
              </div>
              <motion.button
                type="submit"
                className={styles.submit}
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(255, 107, 0, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="pixel-font" style={{ fontSize: '0.7rem' }}>SEND MESSAGE</span>
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
